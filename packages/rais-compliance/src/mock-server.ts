import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import pc from 'picocolors'

export type MockScenario = 'normal' | 'slow' | 'error' | 'malformed' | 'chunked' | 'no-done'

interface MockOptions {
  port: number
  scenario: MockScenario
}

const SCENARIOS: Record<MockScenario, string> = {
  normal: 'Standard RAIS stream — fast tokens, clean done',
  slow: '200ms between tokens — tests chunked parser resilience',
  error: 'Partial tokens then an error event',
  malformed: 'Mix of valid and non-JSON data lines — clients must handle gracefully',
  chunked: 'Tokens split across multiple network flushes — tests buffer logic',
  'no-done': 'Stream ends without a done event — compliance failure (useful for testing)',
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

let eventId = 0

function send(res: ServerResponse, data: object) {
  res.write(`id: ${++eventId}\ndata: ${JSON.stringify(data)}\n\n`)
}

async function handleNormal(res: ServerResponse) {
  const tokens = ['Hello', ',', ' world', '!', ' This', ' is', ' a', ' RAIS', ' stream', '.']
  for (const t of tokens) {
    send(res, { type: 'text', text: t })
  }
  send(res, { type: 'done' })
}

async function handleSlow(res: ServerResponse, signal: AbortSignal) {
  const tokens = ['Thinking', '...', ' slow', ' response', ' incoming', '.']
  for (const t of tokens) {
    if (signal.aborted) return
    send(res, { type: 'text', text: t })
    await sleep(200)
  }
  if (!signal.aborted) send(res, { type: 'done' })
}

async function handleError(res: ServerResponse) {
  send(res, { type: 'text', text: 'Let me check that for you' })
  send(res, { type: 'text', text: '...' })
  await sleep(50)
  send(res, { type: 'error', error: 'Simulated upstream rate limit exceeded' })
}

async function handleMalformed(res: ServerResponse) {
  // Mix of valid events, non-JSON lines, and unknown event types
  res.write(`data: {"type":"text","text":"Hello"}\n\n`)
  res.write(`data: not valid json\n\n`)                          // non-JSON: clients must skip
  res.write(`data: {"type":"text","text":" world"}\n\n`)
  res.write(`data: {"type":"unknown_future_event","foo":"bar"}\n\n`)  // unknown type: clients must ignore
  res.write(`: this is a comment line\n\n`)                      // SSE comment: clients must ignore
  res.write(`data: {"type":"done"}\n\n`)
}

async function handleChunked(res: ServerResponse) {
  // Intentionally fragment events across write calls to test buffering
  const fullEvent = `data: {"type":"text","text":"fragmented"}\n\n`
  res.write(fullEvent.slice(0, 10))
  await sleep(10)
  res.write(fullEvent.slice(10, 25))
  await sleep(10)
  res.write(fullEvent.slice(25))
  res.write(`data: {"type":"text","text":" token"}\n\n`)
  res.write(`data: {"type":"done"}\n\n`)
}

async function handleNoDone(res: ServerResponse) {
  send(res, { type: 'text', text: 'This stream' })
  send(res, { type: 'text', text: ' never sends done' })
  // Intentionally omits done — this is a compliance failure scenario
}

export function startMockServer({ port, scenario }: MockOptions): Promise<() => void> {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // Handle CORS for browser-based clients
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      if (req.method !== 'POST') {
        res.writeHead(405)
        res.end('Method not allowed')
        return
      }

      // Parse body
      let body = ''
      for await (const chunk of req) body += chunk
      let messages: unknown[] = []
      try { messages = JSON.parse(body)?.messages ?? [] } catch { /* use empty */ }

      // RAIS headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.writeHead(200)

      const abortController = new AbortController()
      req.on('close', () => abortController.abort())

      const msgCount = Array.isArray(messages) ? messages.length : 0
      console.log(pc.dim(`  ${new Date().toISOString().slice(11, 23)}  ${req.method} ${req.url}  ${msgCount} message(s)  scenario: ${scenario}`))

      try {
        switch (scenario) {
          case 'normal':    await handleNormal(res); break
          case 'slow':      await handleSlow(res, abortController.signal); break
          case 'error':     await handleError(res); break
          case 'malformed': await handleMalformed(res); break
          case 'chunked':   await handleChunked(res); break
          case 'no-done':   await handleNoDone(res); break
        }
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(500)
        }
        res.write(`data: ${JSON.stringify({ type: 'error', error: (err as Error).message })}\n\n`)
      } finally {
        res.end()
      }
    })

    server.on('error', reject)

    server.listen(port, () => {
      resolve(() => server.close())
    })
  })
}
