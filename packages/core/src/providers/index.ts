import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'
import { CustomProvider } from './custom.js'
import type { AIClient, CreateClientOptions } from '../types.js'

export function createAIClient(options: CreateClientOptions): AIClient {
  if ('provider' in options) {
    if (options.provider === 'openai') {
      return { provider: new OpenAIProvider(options) }
    }
    if (options.provider === 'anthropic') {
      return { provider: new AnthropicProvider(options) }
    }
  }

  if ('endpoint' in options) {
    return { provider: new CustomProvider(options) }
  }

  throw new Error('Invalid createAIClient options: provide provider or endpoint')
}

export { OpenAIProvider, AnthropicProvider, CustomProvider }
