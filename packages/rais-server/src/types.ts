export type Provider = 'openai' | 'anthropic' | 'groq'

export interface ServerConfig {
  port: number
  provider: Provider
  model: string
  apiKey: string
  baseURL?: string
  system?: string
  maxTokens: number
  cors: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamToken {
  type: 'text' | 'done' | 'error'
  text?: string
  error?: string
}
