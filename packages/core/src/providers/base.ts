import { ProviderError } from '../utils/errors.js'
import type { AIProvider } from '../types.js'

export abstract class BaseProvider implements AIProvider {
  protected async fetchStream(
    url: string,
    body: unknown,
    headers: Record<string, string>,
    signal: AbortSignal,
  ): Promise<Response> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText)
      throw new ProviderError(`Request failed: ${text}`, response.status)
    }

    if (!response.body) {
      throw new ProviderError('Response body is null')
    }

    return response
  }

  abstract stream(
    messages: import('../types.js').Message[],
    signal: AbortSignal,
  ): AsyncIterable<import('../types.js').StreamChunk>
}
