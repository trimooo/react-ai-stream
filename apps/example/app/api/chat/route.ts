import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface ChatMessage {
  role: string
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  provider?: 'anthropic' | 'openai' | 'groq'
}

function encodeChunk(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

async function streamOpenAICompatible(
  messages: ChatMessage[],
  url: string,
  apiKey: string,
  model: string,
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => response.statusText)
    throw new Error(`${new URL(url).hostname} error: ${response.status} — ${body}`)
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader()
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
                controller.enqueue(encodeChunk({ type: 'done' }))
                controller.close()
                return
              }
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>
                }
                const text = parsed.choices?.[0]?.delta?.content
                if (text) controller.enqueue(encodeChunk({ type: 'text', text }))
                const finishReason = parsed.choices?.[0]?.finish_reason
                if (finishReason === 'stop' || finishReason === 'length') {
                  controller.enqueue(encodeChunk({ type: 'done' }))
                  controller.close()
                  return
                }
              } catch { /* skip malformed */ }
            }
          }
        }
        controller.enqueue(encodeChunk({ type: 'done' }))
        controller.close()
      } finally {
        reader.releaseLock()
      }
    },
  })
}

async function streamAnthropic(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
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
  })

  if (!response.ok) {
    const body = await response.text().catch(() => response.statusText)
    throw new Error(`Anthropic error: ${response.status} — ${body}`)
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader()
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
              try {
                const parsed = JSON.parse(data) as {
                  type?: string
                  delta?: { type?: string; text?: string }
                }
                if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                  const text = parsed.delta.text
                  if (text) controller.enqueue(encodeChunk({ type: 'text', text }))
                } else if (parsed.type === 'message_stop') {
                  controller.enqueue(encodeChunk({ type: 'done' }))
                  controller.close()
                  return
                }
              } catch { /* skip malformed */ }
            }
          }
        }
        controller.enqueue(encodeChunk({ type: 'done' }))
        controller.close()
      } finally {
        reader.releaseLock()
      }
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody
    const queryProvider = req.nextUrl.searchParams.get('provider') as RequestBody['provider'] | null
    const { messages, provider: bodyProvider = 'groq' } = body
    const provider = queryProvider ?? bodyProvider

    let stream: ReadableStream<Uint8Array>

    if (provider === 'groq') {
      const apiKey = process.env.GROQ_API_KEY
      if (!apiKey) throw new Error('GROQ_API_KEY not set')
      const model = req.nextUrl.searchParams.get('model') ?? 'llama-3.3-70b-versatile'
      stream = await streamOpenAICompatible(
        messages,
        'https://api.groq.com/openai/v1/chat/completions',
        apiKey,
        model,
      )
    } else if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) throw new Error('OPENAI_API_KEY not set')
      stream = await streamOpenAICompatible(
        messages,
        'https://api.openai.com/v1/chat/completions',
        apiKey,
        'gpt-4o-mini',
      )
    } else {
      stream = await streamAnthropic(messages)
    }

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
