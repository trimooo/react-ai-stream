export type Role = 'system' | 'user' | 'assistant' | 'tool'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: Date
  toolName?: string
  toolCallId?: string
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error'
  text?: string
  error?: string
}

export interface AIProvider {
  stream(messages: Message[], signal: AbortSignal): AsyncIterable<StreamChunk>
}

export interface AIClient {
  provider: AIProvider
}

export interface CustomEndpointOptions {
  endpoint: string
  headers?: Record<string, string>
  body?: Record<string, unknown>
}

export interface OpenAIProviderOptions {
  provider: 'openai'
  apiKey: string
  model?: string
  baseURL?: string
  temperature?: number
  system?: string
}

export interface AnthropicProviderOptions {
  provider: 'anthropic'
  apiKey: string
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
}

export type CreateClientOptions =
  | CustomEndpointOptions
  | OpenAIProviderOptions
  | AnthropicProviderOptions

export type UseAIChatOptions =
  | { client: AIClient }
  | OpenAIProviderOptions
  | AnthropicProviderOptions
  | (CustomEndpointOptions & { provider?: never })

export interface UseAIChatCallbacks {
  onToken?: (token: string) => void
  onComplete?: (message: Message) => void
  onError?: (error: Error) => void
}

export interface UseAIChatReturn {
  messages: Message[]
  sendMessage: (content: string) => Promise<void>
  loading: boolean
  stop: () => void
  error: string | null
  clearMessages: () => void
}

export interface ChatState {
  messages: Message[]
  loading: boolean
  error: string | null
  abortController: AbortController | null
}

export interface ChatActions {
  addMessage: (msg: Message) => void
  updateLastAssistantMessage: (content: string) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setAbortController: (ac: AbortController | null) => void
  clearMessages: () => void
}
