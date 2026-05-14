import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface Message { role: string; content: string }

function chunk(data: object) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: Message[] }
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set — copy .env.example to .env.local')

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, stream: true }),
      signal: req.signal,
    })
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => upstream.statusText)
      throw new Error(`OpenAI ${upstream.status}: ${body}`)
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
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                controller.enqueue(chunk({ type: 'done' }))
                controller.close()
                return
              }
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>
                }
                const text = parsed.choices?.[0]?.delta?.content
                if (text) controller.enqueue(chunk({ type: 'text', text }))
                const fin = parsed.choices?.[0]?.finish_reason
                if (fin === 'stop' || fin === 'length') {
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
