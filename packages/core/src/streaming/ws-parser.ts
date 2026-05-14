import type { Message, StreamChunk } from '../types.js'
import { isAbortError } from '../utils/errors.js'

/**
 * Stream RAIS chunks over a WebSocket connection.
 *
 * Protocol: client sends `JSON.stringify({ messages })` after connect.
 * Server responds with RAIS JSON frames: `{"type":"text","text":"..."}`,
 * `{"type":"done"}`, `{"type":"error","error":"..."}`.
 */
export async function* streamWebSocket(
  url: string,
  messages: Message[],
  signal: AbortSignal,
  extraBody: Record<string, unknown> = {},
): AsyncGenerator<StreamChunk> {
  const ws = new WebSocket(url)

  // Abort → close the socket
  const onAbort = () => ws.close(1000, 'Aborted')
  signal.addEventListener('abort', onAbort, { once: true })

  try {
    // Wait for the socket to open
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error('WebSocket connection failed'))
      ws.onclose = (e) => {
        if (!e.wasClean) reject(new Error(`WebSocket closed unexpectedly: ${e.code} ${e.reason}`))
      }
    })

    if (signal.aborted) return

    // Send the conversation
    ws.send(
      JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        ...extraBody,
      }),
    )

    // Yield incoming RAIS frames
    yield* wsChunks(ws, signal)
  } catch (err) {
    if (isAbortError(err)) throw err
    yield { type: 'error', error: err instanceof Error ? err.message : String(err) }
  } finally {
    signal.removeEventListener('abort', onAbort)
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
  }
}

function wsChunks(ws: WebSocket, signal: AbortSignal): AsyncIterable<StreamChunk> {
  return {
    [Symbol.asyncIterator]() {
      const queue: StreamChunk[] = []
      let notify: (() => void) | null = null
      let closed = false

      ws.onmessage = (e) => {
        try {
          const chunk = JSON.parse(e.data as string) as StreamChunk
          queue.push(chunk)
          notify?.()
        } catch { /* skip malformed frames */ }
      }

      const finish = () => {
        closed = true
        notify?.()
      }
      ws.onclose = finish
      ws.onerror = finish
      signal.addEventListener('abort', finish, { once: true })

      return {
        async next() {
          while (true) {
            if (queue.length > 0) {
              return { value: queue.shift()!, done: false }
            }
            if (closed || signal.aborted) {
              return { value: undefined as never, done: true }
            }
            await new Promise<void>((r) => {
              notify = r
            })
            notify = null
          }
        },
        async return() {
          signal.removeEventListener('abort', finish)
          return { value: undefined as never, done: true }
        },
      }
    },
  }
}
