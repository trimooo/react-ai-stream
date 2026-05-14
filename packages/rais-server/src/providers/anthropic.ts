import type { ChatMessage, StreamToken } from '../types.js'

export async function* streamAnthropic(
  messages: ChatMessage[],
  config: { apiKey: string; model: string; system?: string; maxTokens: number },
  signal: AbortSignal,
): AsyncGenerator<StreamToken> {
  let Anthropic: typeof import('@anthropic-ai/sdk').default
  try {
    const mod = await import('@anthropic-ai/sdk')
    Anthropic = mod.default
  } catch {
    yield { type: 'error', error: '@anthropic-ai/sdk not installed. Run: npm install @anthropic-ai/sdk' }
    return
  }

  const client = new Anthropic({ apiKey: config.apiKey })

  // Anthropic does not accept system messages in the messages array
  const userMessages = messages
    .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => m.role !== 'system')

  try {
    const stream = client.messages.stream({
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.system,
      messages: userMessages,
    })

    // Propagate abort
    signal.addEventListener('abort', () => stream.abort(), { once: true })

    for await (const event of stream) {
      if (signal.aborted) return
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', text: event.delta.text }
      } else if (event.type === 'message_stop') {
        break
      }
    }
    yield { type: 'done' }
  } catch (err) {
    const e = err as Error
    if (e.name === 'AbortError' || signal.aborted) return
    yield { type: 'error', error: e.message }
  }
}
