import type { NextApiRequest, NextApiResponse } from 'next'

const PROVIDERS = {
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', format: 'openai' },
  openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', format: 'openai' },
  anthropic: { url: 'https://api.anthropic.com/v1/messages', model: 'claude-haiku-4-5-20251001', format: 'anthropic' },
}

type Provider = keyof typeof PROVIDERS

function sse(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`
}

async function streamOpenAICompatible(
  apiKey: string,
  url: string,
  model: string,
  messages: { role: string; content: string }[],
  res: NextApiResponse,
) {
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => upstream.statusText)
    res.write(sse({ type: 'error', error: `Provider error ${upstream.status}: ${body.slice(0, 200)}` }))
    res.end()
    return
  }

  const reader = upstream.body!.getReader()
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
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') { res.write(sse({ type: 'done' })); res.end(); return }
        try {
          const ev = JSON.parse(data)
          const text = ev.choices?.[0]?.delta?.content
          if (text) res.write(sse({ type: 'text', text }))
          const finish = ev.choices?.[0]?.finish_reason
          if (finish === 'stop' || finish === 'length') { res.write(sse({ type: 'done' })); res.end(); return }
        } catch { /* skip */ }
      }
    }
  }
  res.write(sse({ type: 'done' }))
  res.end()
}

async function streamAnthropic(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  res: NextApiResponse,
) {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 1024, messages, stream: true }),
  })

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => upstream.statusText)
    res.write(sse({ type: 'error', error: `Anthropic error ${upstream.status}: ${body.slice(0, 200)}` }))
    res.end()
    return
  }

  const reader = upstream.body!.getReader()
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
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        try {
          const ev = JSON.parse(data)
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            const text = ev.delta.text
            if (text) res.write(sse({ type: 'text', text }))
          } else if (ev.type === 'message_stop') {
            res.write(sse({ type: 'done' }))
            res.end()
            return
          }
        } catch { /* skip */ }
      }
    }
  }
  res.write(sse({ type: 'done' }))
  res.end()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = (req.headers['x-api-key'] as string | undefined)?.trim()
  const providerName = ((req.headers['x-provider'] as string | undefined) ?? 'groq').toLowerCase() as Provider

  if (!apiKey) {
    res.status(400).json({ error: 'Missing x-api-key header' })
    return
  }

  if (!PROVIDERS[providerName]) {
    res.status(400).json({ error: `Unknown provider "${providerName}". Use: groq, openai, anthropic` })
    return
  }

  const { messages } = req.body as { messages: { role: string; content: string }[] }
  const { url, model, format } = PROVIDERS[providerName]

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    if (format === 'anthropic') {
      await streamAnthropic(apiKey, model, messages, res)
    } else {
      await streamOpenAICompatible(apiKey, url, model, messages, res)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!res.writableEnded) {
      res.write(sse({ type: 'error', error: msg }))
      res.end()
    }
  }
}
