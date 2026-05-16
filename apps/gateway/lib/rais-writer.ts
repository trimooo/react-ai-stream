import type { StreamChunk } from '@react-ai-stream/core'

// Converts an AsyncIterable of StreamChunks into a ReadableStream of RAIS v1 SSE bytes.
// Ported from packages/express/src/sse-writer.ts, adapted for the Web Streams API.

export function chunksToStream(
  chunks: AsyncIterable<StreamChunk>,
  onComplete?: (tokenCount: number) => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let tokenCount = 0

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          const frame = `data: ${JSON.stringify(chunk)}\n\n`
          controller.enqueue(encoder.encode(frame))
          if (chunk.type === 'text') tokenCount += Math.ceil((chunk.text ?? '').length / 4)
          if (chunk.type === 'done' || chunk.type === 'error') break
        }
      } catch (err) {
        const errChunk: StreamChunk = { type: 'error', error: String(err) }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errChunk)}\n\n`))
      } finally {
        controller.close()
        onComplete?.(tokenCount)
      }
    },
  })
}

export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-store',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  }
}
