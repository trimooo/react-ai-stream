import type { Response } from 'express'
import type { StreamChunk } from '@react-ai-stream/core'

export function writeSseHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  // Disable nginx/proxy buffering so chunks flush immediately
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
}

export async function pipeChunksToResponse(
  chunks: AsyncIterable<StreamChunk>,
  res: Response,
): Promise<void> {
  try {
    for await (const chunk of chunks) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      if (chunk.type === 'done' || chunk.type === 'error') break
    }
  } finally {
    if (!res.writableEnded) res.end()
  }
}
