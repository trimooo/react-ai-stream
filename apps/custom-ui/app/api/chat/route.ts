import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface ChatMessage {
  role: string
  content: string
}

function encodeSSE(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
])

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] }
  const model = req.nextUrl.searchParams.get('model') ?? 'llama-3.3-70b-versatile'

  if (!ALLOWED_MODELS.has(model)) {
    return new Response(JSON.stringify({ error: 'Unknown model' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => upstream.statusText)
    return new Response(JSON.stringify({ error: body }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          for (const part of parts) {
            for (const line of part.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                controller.enqueue(encodeSSE({ type: 'done' }))
                controller.close()
                return
              }
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>
                }
                const text = parsed.choices?.[0]?.delta?.content
                if (text) controller.enqueue(encodeSSE({ type: 'text', text }))
                if (parsed.choices?.[0]?.finish_reason === 'stop') {
                  controller.enqueue(encodeSSE({ type: 'done' }))
                  controller.close()
                  return
                }
              } catch { /* skip malformed lines */ }
            }
          }
        }
        controller.enqueue(encodeSSE({ type: 'done' }))
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
}
