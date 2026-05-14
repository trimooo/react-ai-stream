import { describe, it, expect, vi, afterEach } from 'vitest'
import { raisMiddleware } from '../src/index.js'
import type { StreamChunk, Message } from '@react-ai-stream/core'

afterEach(() => { vi.restoreAllMocks() })

type MockReq = {
  body: unknown
  on: (event: string, fn: () => void) => MockReq
  _close: () => void
}

type MockRes = {
  headers: Record<string, string>
  written: string[]
  statusCode: number | null
  ended: boolean
  headersSent: boolean
  writableEnded: boolean
  setHeader: (k: string, v: string) => MockRes
  flushHeaders: () => void
  write: (chunk: string) => boolean
  end: () => MockRes
  status: (code: number) => MockRes
  json: (data: unknown) => MockRes
}

function makeMockReq(body: unknown): MockReq {
  const handlers: Record<string, Array<() => void>> = {}
  const req: MockReq = {
    body,
    on(event: string, fn: () => void) { handlers[event] = handlers[event] ?? []; handlers[event].push(fn); return req },
    _close() { handlers['close']?.forEach((fn) => fn()) },
  }
  return req
}

function makeMockRes(): MockRes {
  const written: string[] = []
  const headers: Record<string, string> = {}
  let ended = false
  let statusCode: number | null = null
  const res: MockRes = {
    headers, written,
    get statusCode() { return statusCode },
    get ended() { return ended },
    get headersSent() { return written.length > 0 },
    get writableEnded() { return ended },
    setHeader: vi.fn((k, v) => { headers[k] = v; return res }) as any,
    flushHeaders: vi.fn(),
    write: vi.fn((chunk) => { written.push(chunk); return true }) as any,
    end: vi.fn(() => { ended = true; return res }) as any,
    status: vi.fn((code) => { statusCode = code; return res }) as any,
    json: vi.fn((data) => { written.push(JSON.stringify(data)); return res }) as any,
  }
  return res
}

async function* makeStream(chunks: StreamChunk[]): AsyncIterable<StreamChunk> {
  for (const c of chunks) yield c
}

describe('raisMiddleware — custom handler', () => {
  it('writes SSE headers and streams chunks', async () => {
    const handler = vi.fn(async function* () {
      yield { type: 'text', text: 'Hello' } as StreamChunk
      yield { type: 'done' } as StreamChunk
    })
    const middleware = raisMiddleware({ handler })
    const req = makeMockReq({ messages: [{ role: 'user', content: 'hi' }] })
    const res = makeMockRes()

    await middleware(req as any, res as any, vi.fn())

    expect(res.headers['Content-Type']).toBe('text/event-stream')
    expect(res.headers['Cache-Control']).toBe('no-cache')
    expect(res.written.some((w) => w.includes('"Hello"'))).toBe(true)
    expect(res.ended).toBe(true)
  })

  it('passes messages from req.body to handler', async () => {
    const handler = vi.fn(async function* (_msgs: Message[]) {
      yield { type: 'done' } as StreamChunk
    })
    const middleware = raisMiddleware({ handler })
    const messages = [{ role: 'user' as const, content: 'test', id: '1', createdAt: new Date() }]
    const req = makeMockReq({ messages })
    const res = makeMockRes()

    await middleware(req as any, res as any, vi.fn())
    expect(handler.mock.calls[0]![0]).toEqual(messages)
  })

  it('uses empty messages array when body has none', async () => {
    const handler = vi.fn(async function* (msgs: Message[]) {
      expect(msgs).toEqual([])
      yield { type: 'done' } as StreamChunk
    })
    const middleware = raisMiddleware({ handler })
    const req = makeMockReq({})
    const res = makeMockRes()
    await middleware(req as any, res as any, vi.fn())
    expect(handler).toHaveBeenCalledOnce()
  })

  it('aborts signal when client disconnects', async () => {
    let capturedSignal!: AbortSignal
    const handler = vi.fn(async function* (_msgs: Message[], signal: AbortSignal) {
      capturedSignal = signal
      yield { type: 'done' } as StreamChunk
    })
    const middleware = raisMiddleware({ handler })
    const req = makeMockReq({ messages: [] })
    const res = makeMockRes()
    await middleware(req as any, res as any, vi.fn())
    req._close()
    expect(capturedSignal.aborted).toBe(true)
  })
})
