import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface Message { role: string; content: string }

function chunk(data: object) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: Message[] }
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set — copy .env.example to .env.local')

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: messages.filter((m) => m.role !== 'system'),
        stream: true,
      }),
      signal: req.signal,
    })
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => upstream.statusText)
      throw new Error(`Anthropic ${upstream.status}: ${body}`)
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader()
        const dec = new TextDecoder()
        let buf = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += dec.decode(value, { stream: true })
            const parts = buf.split('\n\n')
            buf = parts.pop() ?? ''
            for (const part of parts) {
              const line = part.split('\n').find((l) => l.startsWith('data: '))
              if (!line) continue
              try {
                const parsed = JSON.parse(line.slice(6)) as {
                  type?: string
                  delta?: { type?: string; text?: string }
                }
                if (
                  parsed.type === 'content_block_delta' &&
                  parsed.delta?.type === 'text_delta' &&
                  parsed.delta.text
                ) {
                  controller.enqueue(chunk({ type: 'text', text: parsed.delta.text }))
                } else if (parsed.type === 'message_stop') {
                  controller.enqueue(chunk({ type: 'done' }))
                  controller.close()
                  return
                }
              } catch { /* skip malformed */ }
            }
          }
          controller.enqueue(chunk({ type: 'done' }))
          controller.close()
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
