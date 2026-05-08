import { describe, it, expect } from 'vitest'
import { parseSSE } from '../src/streaming/sse-parser.js'

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const results: string[] = []
  for await (const item of parseSSE(stream)) {
    results.push(item)
  }
  return results
}

describe('parseSSE', () => {
  it('parses single data line', async () => {
    const stream = makeStream(['data: {"hello":"world"}\n\n'])
    expect(await collect(stream)).toEqual(['{"hello":"world"}'])
  })

  it('stops on [DONE]', async () => {
    const stream = makeStream(['data: first\n\ndata: [DONE]\n\ndata: after\n\n'])
    expect(await collect(stream)).toEqual(['first'])
  })

  it('handles split chunks', async () => {
    const stream = makeStream(['data: hel', 'lo\n\n'])
    expect(await collect(stream)).toEqual(['hello'])
  })

  it('skips non-data lines', async () => {
    const stream = makeStream(['event: ping\ndata: payload\n\n'])
    expect(await collect(stream)).toEqual(['payload'])
  })

  it('handles multiple events', async () => {
    const stream = makeStream(['data: one\n\ndata: two\n\ndata: three\n\n'])
    expect(await collect(stream)).toEqual(['one', 'two', 'three'])
  })
})
