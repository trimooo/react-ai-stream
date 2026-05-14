import type { ChatMessage, StreamToken } from '../types.js'

export async function* streamOpenAI(
  messages: ChatMessage[],
  config: { apiKey: string; model: string; baseURL?: string; system?: string; maxTokens: number },
  signal: AbortSignal,
): AsyncGenerator<StreamToken> {
  let OpenAI: typeof import('openai').default
  try {
    const mod = await import('openai')
    OpenAI = mod.default
  } catch {
    yield { type: 'error', error: 'openai package not installed. Run: npm install openai' }
    return
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  })

  const allMessages = config.system
    ? [{ role: 'system' as const, content: config.system }, ...messages]
    : messages

  try {
    const stream = await client.chat.completions.create({
      model: config.model,
      messages: allMessages,
      stream: true,
      max_tokens: config.maxTokens,
    }, { signal })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) yield { type: 'text', text: delta }
      if (chunk.choices[0]?.finish_reason) break
    }
    yield { type: 'done' }
  } catch (err) {
    const e = err as Error
    if (e.name === 'AbortError' || signal.aborted) return
    yield { type: 'error', error: e.message }
  }
}
