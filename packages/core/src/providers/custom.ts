import { BaseProvider } from './base.js'
import { parseSSE } from '../streaming/sse-parser.js'
import { normalizeCustomChunk } from '../streaming/chunk-normalizer.js'
import { isAbortError } from '../utils/errors.js'
import type { Message, StreamChunk, CustomEndpointOptions } from '../types.js'

export class CustomProvider extends BaseProvider {
  private readonly endpoint: string
  private readonly headers: Record<string, string>
  private readonly extraBody: Record<string, unknown>

  constructor(options: CustomEndpointOptions) {
    super()
    this.endpoint = options.endpoint
    this.headers = options.headers ?? {}
    this.extraBody = options.body ?? {}
  }

  async *stream(messages: Message[], signal: AbortSignal): AsyncIterable<StreamChunk> {
    const body = {
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      ...this.extraBody,
    }

    try {
      const response = await this.fetchStream(this.endpoint, body, this.headers, signal)

      for await (const raw of parseSSE(response.body!)) {
        const chunk = normalizeCustomChunk(raw)
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
