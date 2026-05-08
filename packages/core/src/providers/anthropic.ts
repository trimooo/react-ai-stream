import { BaseProvider } from './base.js'
import { parseSSE } from '../streaming/sse-parser.js'
import { normalizeAnthropicChunk } from '../streaming/chunk-normalizer.js'
import { isAbortError } from '../utils/errors.js'
import type { Message, StreamChunk, AnthropicProviderOptions } from '../types.js'

export class AnthropicProvider extends BaseProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly maxTokens: number
  private readonly temperature: number | undefined
  private readonly system: string | undefined

  constructor(options: AnthropicProviderOptions) {
    super()
    this.apiKey = options.apiKey
    this.model = options.model ?? 'claude-sonnet-4-6'
    this.maxTokens = options.maxTokens ?? 1024
    this.temperature = options.temperature
    this.system = options.system
  }

  async *stream(messages: Message[], signal: AbortSignal): AsyncIterable<StreamChunk> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }
    if (this.system) body['system'] = this.system
    if (this.temperature !== undefined) body['temperature'] = this.temperature

    try {
      const response = await this.fetchStream(
        'https://api.anthropic.com/v1/messages',
        body,
        {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal,
      )

      for await (const raw of parseSSE(response.body!)) {
        const chunk = normalizeAnthropicChunk(raw)
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
