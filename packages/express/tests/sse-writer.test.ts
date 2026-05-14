import { describe, it, expect, vi } from 'vitest'
import { writeSseHeaders, pipeChunksToResponse } from '../src/sse-writer.js'
import type { StreamChunk } from '@react-ai-stream/core'

function makeMockRes() {
  const headers: Record<string, string> = {}
  const written: string[] = []
  let ended = false
  const res = {
    headers,
    written,
    get writableEnded() { return ended },
    setHeader: vi.fn((k: string, v: string) => { headers[k] = v }),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => { written.push(chunk); return true }),
    end: vi.fn(() => { ended = true }),
  }
  return res
}

async function* makeStream(chunks: StreamChunk[]): AsyncIterable<StreamChunk> {
  for (const c of chunks) yield c
}

describe('writeSseHeaders', () => {
  it('sets Content-Type to text/event-stream', () => {
    const res = makeMockRes()
    writeSseHeaders(res as any)
    expect(res.headers['Content-Type']).toBe('text/event-stream')
  })

  it('sets Cache-Control to no-cache', () => {
    const res = makeMockRes()
    writeSseHeaders(res as any)
    expect(res.headers['Cache-Control']).toBe('no-cache')
  })

  it('sets Connection to keep-alive', () => {
    const res = makeMockRes()
    writeSseHeaders(res as any)
    expect(res.headers['Connection']).toBe('keep-alive')
  })

  it('sets X-Accel-Buffering to no', () => {
    const res = makeMockRes()
    writeSseHeaders(res as any)
    expect(res.headers['X-Accel-Buffering']).toBe('no')
  })

  it('calls flushHeaders', () => {
    const res = makeMockRes()
    writeSseHeaders(res as any)
    expect(res.flushHeaders).toHaveBeenCalledOnce()
  })
})

describe('pipeChunksToResponse', () => {
  it('writes text chunks as SSE data lines', async () => {
    const res = makeMockRes()
    await pipeChunksToResponse(makeStream([
      { type: 'text', text: 'Hello' },
      { type: 'done' },
    ]), res as any)
    expect(res.written[0]).toBe('data: {"type":"text","text":"Hello"}\n\n')
    expect(res.written[1]).toBe('data: {"type":"done"}\n\n')
  })

  it('ends the response after done chunk', async () => {
    const res = makeMockRes()
    await pipeChunksToResponse(makeStream([{ type: 'done' }]), res as any)
    expect(res.end).toHaveBeenCalled()
  })

  it('stops streaming after done and does not write further chunks', async () => {
    const res = makeMockRes()
    async function* leakyStream(): AsyncIterable<StreamChunk> {
      yield { type: 'text', text: 'A' }
      yield { type: 'done' }
      yield { type: 'text', text: 'should not appear' }
    }
    await pipeChunksToResponse(leakyStream(), res as any)
    expect(res.written).toHaveLength(2)
    expect(res.written[1]).toBe('data: {"type":"done"}\n\n')
  })

  it('stops streaming after error chunk', async () => {
    const res = makeMockRes()
    await pipeChunksToResponse(makeStream([
      { type: 'error', error: 'oops' },
    ]), res as any)
    expect(res.written).toHaveLength(1)
    expect(res.written[0]).toContain('"type":"error"')
    expect(res.end).toHaveBeenCalled()
  })

  it('does not call end() if response is already ended', async () => {
    const res = makeMockRes()
    res.end() // pre-end it
    vi.clearAllMocks()
    await pipeChunksToResponse(makeStream([]), res as any)
    expect(res.end).not.toHaveBeenCalled()
  })
})
