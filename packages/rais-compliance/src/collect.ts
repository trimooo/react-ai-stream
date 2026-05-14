import type { CollectedStream, RaisEvent } from './types.js'

const TIMEOUT_MS = 30_000

export async function collectStream(
  endpoint: string,
  messages: Array<{ role: string; content: string }>,
): Promise<CollectedStream> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout))

  const headers: Record<string, string> = {}
  res.headers.forEach((value, key) => { headers[key.toLowerCase()] = value })

  const events: RaisEvent[] = []
  const rawLines: string[] = []

  if (!res.body) {
    return { headers, events, rawLines, statusCode: res.status }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop() ?? ''
    for (const part of parts) {
      for (const line of part.split('\n')) {
        const trimmed = line.trim()
        if (trimmed) rawLines.push(trimmed)
        if (!trimmed.startsWith('data: ')) continue
        try {
          const event = JSON.parse(trimmed.slice(6)) as RaisEvent
          events.push(event)
          if (event.type === 'done' || event.type === 'error') {
            await reader.cancel()
            return { headers, events, rawLines, statusCode: res.status }
          }
        } catch {
          // invalid JSON — runner will catch via rawLines check
        }
      }
    }
  }

  return { headers, events, rawLines, statusCode: res.status }
}
