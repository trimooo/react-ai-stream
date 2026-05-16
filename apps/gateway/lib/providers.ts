import type { StreamChunk } from '@react-ai-stream/core'

// Minimal message shape used by the gateway — provider APIs only need role + content
export interface GatewayMessage {
  role: string
  content: string
}

// Provider definitions. We call the provider APIs directly here (without @react-ai-stream/core's
// createAIClient) so we can inject our server-side keys and add the fallback loop.

export type ProviderName = 'groq' | 'openai' | 'anthropic' | 'gemini'

export interface ProviderConfig {
  name: ProviderName
  baseUrl: string
  defaultModel: string
  envKey: string
  // Transform the response stream into RAIS StreamChunks
  parse: (stream: ReadableStream<Uint8Array>) => AsyncIterable<StreamChunk>
}

// Shared OpenAI-compatible SSE parser (works for OpenAI, Groq, Gemini-compat)
async function* parseOpenAIStream(stream: ReadableStream<Uint8Array>): AsyncIterable<StreamChunk> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') { yield { type: 'done' }; return }
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta.length > 0) yield { type: 'text', text: delta }
        } catch { /* skip malformed frames */ }
      }
    }
  } finally {
    reader.releaseLock()
  }
  yield { type: 'done' }
}

// Anthropic SSE parser
async function* parseAnthropicStream(stream: ReadableStream<Uint8Array>): AsyncIterable<StreamChunk> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      let eventType = ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('event:')) { eventType = trimmed.slice(6).trim(); continue }
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (eventType === 'message_stop') { yield { type: 'done' }; return }
        if (eventType === 'content_block_delta') {
          try {
            const parsed = JSON.parse(data)
            const text = parsed.delta?.text
            if (typeof text === 'string' && text.length > 0) yield { type: 'text', text }
          } catch { /* skip */ }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
  yield { type: 'done' }
}

export const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  groq: {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
    parse: parseOpenAIStream,
  },
  openai: {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
    parse: parseOpenAIStream,
  },
  anthropic: {
    name: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-haiku-4-5-20251001',
    envKey: 'ANTHROPIC_API_KEY',
    parse: parseAnthropicStream,
  },
  gemini: {
    name: 'gemini',
    // Gemini OpenAI-compat endpoint — requires GEMINI_API_KEY set as Authorization: Bearer
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-1.5-flash',
    envKey: 'GEMINI_API_KEY',
    parse: parseOpenAIStream,
  },
}

const FALLBACK_ORDER: ProviderName[] = ['groq', 'openai', 'anthropic', 'gemini']

export interface StreamRequest {
  messages: GatewayMessage[]
  provider?: ProviderName
  model?: string
  max_tokens?: number
  fallback?: ProviderName[]
  signal?: AbortSignal
}

export async function* streamFromProvider(
  config: ProviderConfig,
  messages: GatewayMessage[],
  model: string,
  max_tokens: number,
  signal?: AbortSignal,
): AsyncIterable<StreamChunk> {
  const apiKey = process.env[config.envKey]
  if (!apiKey) {
    yield { type: 'error', error: `Provider ${config.name} not configured on this gateway` }
    return
  }

  let body: unknown
  let headers: Record<string, string>

  if (config.name === 'anthropic') {
    body = {
      model,
      max_tokens,
      stream: true,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content,
    }
    headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }
  } else {
    body = { model, max_tokens, stream: true, messages }
    headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  }

  const res = await fetch(config.baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => res.statusText)
    yield { type: 'error', error: `${config.name} error ${res.status}: ${text}` }
    return
  }

  yield* config.parse(res.body)
}

export async function* streamWithFallback(
  req: StreamRequest,
): AsyncIterable<StreamChunk> {
  const primaryName: ProviderName = req.provider ?? 'groq'
  const max_tokens = req.max_tokens ?? 4096

  // Build chain: primary → explicit fallback list → auto-fallback (any configured provider)
  const explicitFallback = req.fallback ?? []
  const autoFallback = FALLBACK_ORDER.filter(
    n => n !== primaryName && !explicitFallback.includes(n) && !!(process.env[PROVIDERS[n].envKey] ?? ''),
  )
  const chain: ProviderName[] = [primaryName, ...explicitFallback, ...autoFallback]

  for (const name of chain) {
    const config = PROVIDERS[name]
    if (!config) continue
    const model = name === primaryName && req.model ? req.model : config.defaultModel
    try {
      let errorSeen = false
      for await (const chunk of streamFromProvider(config, req.messages, model, max_tokens, req.signal)) {
        if (chunk.type === 'error') { errorSeen = true; break }
        yield chunk
      }
      if (!errorSeen) return
    } catch { /* try next provider */ }
  }
  yield { type: 'error', error: 'All providers failed or none are configured' }
}
