import pc from 'picocolors'
import { collectStream } from './collect.js'
import type { TestResult, CollectedStream } from './types.js'

type TestFn = (stream: CollectedStream) => TestResult

const MUST_TESTS: Array<[string, TestFn]> = [
  [
    'headers.content-type',
    ({ headers }) => {
      const ct = headers['content-type'] ?? ''
      return ct.includes('text/event-stream')
        ? pass('Content-Type is text/event-stream')
        : fail(`Content-Type is "${ct}" — expected text/event-stream`)
    },
  ],
  [
    'headers.cache-control',
    ({ headers }) => {
      const cc = headers['cache-control'] ?? ''
      return cc.includes('no-cache')
        ? pass('Cache-Control: no-cache present')
        : fail(`Cache-Control is "${cc}" — expected no-cache`)
    },
  ],
  [
    'events.format',
    ({ events, rawLines }) => {
      const bad = rawLines.filter((l) => l.startsWith('data: ')).filter((l) => {
        try { JSON.parse(l.slice(6)); return false } catch { return true }
      })
      return bad.length === 0
        ? pass(`All ${rawLines.filter((l) => l.startsWith('data: ')).length} data lines are valid JSON`)
        : fail(`${bad.length} data line(s) are not valid JSON: ${bad.slice(0, 2).join(', ')}`)
    },
  ],
  [
    'events.text-type',
    ({ events }) => {
      const textEvents = events.filter((e) => e.type === 'text')
      if (textEvents.length === 0) return warn('No text events received — cannot verify text field')
      const bad = textEvents.filter((e) => typeof e.text !== 'string')
      return bad.length === 0
        ? pass(`All ${textEvents.length} text events have a "text" string field`)
        : fail(`${bad.length} text event(s) missing "text" field`)
    },
  ],
  [
    'events.done',
    ({ events }) => {
      const doneEvents = events.filter((e) => e.type === 'done')
      const errorEvents = events.filter((e) => e.type === 'error')
      if (doneEvents.length === 0 && errorEvents.length > 0) {
        return skip('Stream ended with error event — no done expected (valid RAIS termination)')
      }
      if (doneEvents.length === 0) return fail('No done event received — stream did not terminate cleanly')
      if (doneEvents.length > 1) return fail(`${doneEvents.length} done events received — expected exactly one`)
      const lastEvent = events[events.length - 1]
      return lastEvent?.type === 'done'
        ? pass('Exactly one done event, last in stream')
        : fail('done event is not the last event in stream')
    },
  ],
  [
    'events.no-after-done',
    ({ events }) => {
      const doneIdx = events.findIndex((e) => e.type === 'done')
      if (doneIdx === -1) return skip('No done event — cannot check post-done events')
      const after = events.slice(doneIdx + 1)
      return after.length === 0
        ? pass('No events emitted after done')
        : fail(`${after.length} event(s) emitted after done: ${after.map((e) => e.type).join(', ')}`)
    },
  ],
  [
    'events.has-text-tokens',
    ({ events }) => {
      const textEvents = events.filter((e) => e.type === 'text')
      return textEvents.length > 0
        ? pass(`Received ${textEvents.length} text token(s)`)
        : warn('No text tokens received — check that your endpoint returns streaming output')
    },
  ],
]

const SHOULD_TESTS: Array<[string, TestFn]> = [
  [
    'headers.accel-buffering',
    ({ headers }) => {
      const h = headers['x-accel-buffering']
      return h === 'no'
        ? pass('X-Accel-Buffering: no present (nginx proxy-safe)')
        : warn('X-Accel-Buffering header not set — add "X-Accel-Buffering: no" for nginx deployments')
    },
  ],
  [
    'events.sse-id',
    ({ rawLines }) => {
      const idLines = rawLines.filter((l) => l.startsWith('id: ') || l === 'id:')
      return idLines.length > 0
        ? pass(`${idLines.length} event(s) have id: fields (reconnect-safe)`)
        : warn('No id: fields — add SSE event IDs for safe reconnect (Last-Event-ID support)')
    },
  ],
]

export async function runTests(
  endpoint: string,
  messages: Array<{ role: string; content: string }>,
): Promise<{ passed: number; warned: number; failed: number }> {
  let stream: CollectedStream
  try {
    stream = await collectStream(endpoint, messages)
  } catch (err) {
    console.log(pc.red(`  ✕  Connection failed: ${(err as Error).message}`))
    return { passed: 0, warned: 0, failed: 1 }
  }

  let passed = 0
  let warned = 0
  let failed = 0

  console.log(pc.bold('  MUST (normative)'))
  for (const [name, fn] of MUST_TESTS) {
    const result = fn(stream)
    printResult(name, result, 'must')
    if (result.status === 'pass') passed++
    else if (result.status === 'warn') { warned++; passed++ }
    else if (result.status === 'skip') passed++
    else failed++
  }

  console.log()
  console.log(pc.bold('  SHOULD (recommended)'))
  for (const [name, fn] of SHOULD_TESTS) {
    const result = fn(stream)
    printResult(name, result, 'should')
    if (result.status === 'pass') passed++
    else if (result.status === 'warn') warned++
    else if (result.status === 'fail') warned++ // SHOULD failures are warnings
    else passed++
  }

  console.log()
  console.log(pc.bold('  ABORT (resilience)'))
  const abortResult = await runAbortTest(endpoint, messages)
  printResult('abort.clean', abortResult, 'must')
  if (abortResult.status === 'pass') passed++
  else if (abortResult.status === 'skip') passed++
  else failed++

  return { passed, warned, failed }
}

async function runAbortTest(
  endpoint: string,
  messages: Array<{ role: string; content: string }>,
): Promise<TestResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    })

    if (!res.body) return skip('No response body — cannot test abort')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let receivedFirstToken = false
    const start = Date.now()

    // Read until we get the first text event, then abort
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      if (!receivedFirstToken && text.includes('"type":"text"')) {
        receivedFirstToken = true
        controller.abort()
        clearTimeout(timeout)
        await reader.cancel()
        const elapsed = Date.now() - start
        return pass(`Aborted cleanly after first token (${elapsed}ms) — server did not hang`)
      }
      if (Date.now() - start > 8000) {
        return fail('Server did not produce any text tokens within 8s — abort test inconclusive')
      }
    }

    clearTimeout(timeout)
    return skip('Stream completed before first token arrived — abort test inconclusive')
  } catch (err) {
    clearTimeout(timeout)
    const e = err as Error
    if (e.name === 'AbortError') {
      return pass('AbortError thrown cleanly — client abort behavior correct')
    }
    return fail(`Abort test failed with unexpected error: ${e.message}`)
  }
}

function printResult(name: string, result: TestResult, level: 'must' | 'should') {
  const prefix = `    ${name.padEnd(34)}`
  if (result.status === 'pass') {
    console.log(`${prefix} ${pc.green('✓')} ${pc.dim(result.message)}`)
  } else if (result.status === 'warn') {
    console.log(`${prefix} ${pc.yellow('⚠')} ${pc.yellow(result.message)}`)
  } else if (result.status === 'fail') {
    const marker = level === 'must' ? pc.red('✕') : pc.yellow('⚠')
    console.log(`${prefix} ${marker} ${level === 'must' ? pc.red(result.message) : pc.yellow(result.message)}`)
  } else {
    console.log(`${prefix} ${pc.dim('–')} ${pc.dim(result.message)}`)
  }
}

function pass(message: string): TestResult { return { status: 'pass', message } }
function fail(message: string): TestResult { return { status: 'fail', message } }
function warn(message: string): TestResult { return { status: 'warn', message } }
function skip(message: string): TestResult { return { status: 'skip', message } }
