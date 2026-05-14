import { shallowRef, onUnmounted } from 'vue'
import {
  createAIClient,
  isAbortError,
  createAbortController,
} from '@react-ai-stream/core'
import type {
  Message,
  AIClient,
  OpenAIProviderOptions,
  AnthropicProviderOptions,
  CustomEndpointOptions,
  UseAIChatCallbacks,
} from '@react-ai-stream/core'

export type UseAIChatOptions =
  | { client: AIClient }
  | OpenAIProviderOptions
  | AnthropicProviderOptions
  | (CustomEndpointOptions & { provider?: never })

function resolveClient(options: UseAIChatOptions, cached: AIClient | null): AIClient {
  if ('client' in options) return options.client
  if (cached) return cached
  return createAIClient(options as OpenAIProviderOptions | AnthropicProviderOptions | CustomEndpointOptions)
}

/**
 * Vue 3 composable for RAIS-protocol AI streaming.
 * Returns shallowRefs so callers should access `.value` in <script setup>
 * (Vue auto-unwraps them in templates).
 */
export function useAIChat(options: UseAIChatOptions & UseAIChatCallbacks) {
  const messages = shallowRef<Message[]>([])
  const loading = shallowRef(false)
  const error = shallowRef<string | null>(null)

  let abortController: AbortController | null = null
  let cachedClient: AIClient | null = null

  async function sendMessage(content: string) {
    if (loading.value) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    }
    messages.value = [...messages.value, userMessage]
    loading.value = true
    error.value = null

    const controller = createAbortController()
    abortController = controller

    const assistantId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }
    messages.value = [...messages.value, assistantMessage]

    let accumulated = ''

    try {
      const client = resolveClient(options, cachedClient)
      if (!('client' in options)) cachedClient = client

      const currentMessages = messages.value.slice(0, -1)
      for await (const chunk of client.provider.stream(currentMessages, controller.signal)) {
        if (chunk.type === 'text' && chunk.text) {
          accumulated += chunk.text
          const msgs = [...messages.value]
          msgs[msgs.length - 1] = { ...assistantMessage, content: accumulated }
          messages.value = msgs
          options.onToken?.(chunk.text)
        } else if (chunk.type === 'error') {
          const errMsg = chunk.error ?? 'Stream error'
          error.value = errMsg
          options.onError?.(new Error(errMsg))
          break
        } else if (chunk.type === 'done') {
          break
        }
      }

      if (accumulated) {
        options.onComplete?.({ ...assistantMessage, content: accumulated })
      }
    } catch (err) {
      if (!isAbortError(err)) {
        const msg = err instanceof Error ? err.message : String(err)
        error.value = msg
        options.onError?.(err instanceof Error ? err : new Error(msg))
      }
    } finally {
      loading.value = false
      abortController = null
    }
  }

  function stop() {
    abortController?.abort()
    loading.value = false
    abortController = null
  }

  function clearMessages() {
    messages.value = []
  }

  onUnmounted(() => {
    abortController?.abort()
  })

  return {
    messages,
    loading,
    error,
    sendMessage,
    stop,
    clearMessages,
  }
}
