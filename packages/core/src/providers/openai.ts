import { BaseProvider } from './base.js'
import { parseSSE } from '../streaming/sse-parser.js'
import { normalizeOpenAIChunk } from '../streaming/chunk-normalizer.js'
import { isAbortError } from '../utils/errors.js'
import type { Message, StreamChunk, OpenAIProviderOptions } from '../types.js'

export class OpenAIProvider extends BaseProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly baseURL: string
  private readonly temperature: number | undefined
  private readonly system: string | undefined

  constructor(options: OpenAIProviderOptions) {
    super()
    this.apiKey = options.apiKey
    this.model = options.model ?? 'gpt-4o'
    this.baseURL = options.baseURL ?? 'https://api.openai.com/v1'
    this.temperature = options.temperature
    this.system = options.system
  }

  async *stream(messages: Message[], signal: AbortSignal): AsyncIterable<StreamChunk> {
    const openAIMessages = this.system
      ? [{ role: 'system', content: this.system }, ...messages]
      : messages

    const body: Record<string, unknown> = {
      model: this.model,
      messages: openAIMessages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }
    if (this.temperature !== undefined) body['temperature'] = this.temperature

    try {
      const response = await this.fetchStream(
        `${this.baseURL}/chat/completions`,
        body,
        { Authorization: `Bearer ${this.apiKey}` },
        signal,
      )

      for await (const raw of parseSSE(response.body!)) {
        const chunk = normalizeOpenAIChunk(raw)
        if (!chunk) continue
        yield chunk
        if (chunk.type === 'done' || chunk.type === 'error') return
      }
    } catch (err) {
      if (isAbortError(err)) throw err
      yield { type: 'error', error: err instanceof Error ? err.message : String(err) }
    }
  }
}
