import { useRef, useEffect, useContext, useCallback } from 'react'
import { useSyncExternalStore } from 'react'
import {
  createMessageStore,
  createAIClient,
  isAbortError,
  createAbortController,
} from '@react-ai-stream/core'
import type {
  UseAIChatOptions,
  UseAIChatCallbacks,
  UseAIChatReturn,
  Message,
  AIClient,
} from '@react-ai-stream/core'
import { AIChatContext } from '../context/AIChatContext.js'
import { useStableCallback } from './use-stable-callback.js'

const EMPTY_MESSAGES: Message[] = []

function resolveClient(options: UseAIChatOptions, contextClient: AIClient | null): AIClient {
  if ('client' in options) return options.client
  if (contextClient) return contextClient
  if ('provider' in options && options.provider) {
    return createAIClient(options)
  }
  if ('endpoint' in options) {
    return createAIClient(options)
  }
  throw new Error(
    'useAIChat: provide a client, a provider config, an endpoint, or wrap with AIChatProvider',
  )
}

export function useAIChat(options: UseAIChatOptions & UseAIChatCallbacks): UseAIChatReturn {
  const contextClient = useContext(AIChatContext)
  const storeRef = useRef<ReturnType<typeof createMessageStore> | null>(null)
  const clientRef = useRef<AIClient | null>(null)

  if (!storeRef.current) {
    storeRef.current = createMessageStore()
  }

  const store = storeRef.current

  const messages = useSyncExternalStore(
    store.subscribe,
    () => store.getState().messages,
    () => EMPTY_MESSAGES,
  )
  const loading = useSyncExternalStore(
    store.subscribe,
    () => store.getState().loading,
    () => false,
  )
  const error = useSyncExternalStore(
    store.subscribe,
    () => store.getState().error,
    () => null,
  )

  useEffect(() => {
    return () => {
      store.getState().abortController?.abort()
    }
  }, [store])

  const stop = useCallback(() => {
    const state = store.getState()
    state.abortController?.abort()
    state.setLoading(false)
    state.setAbortController(null)
  }, [store])

  const optionsRef = useRef(options)
  optionsRef.current = options

  const sendMessage = useStableCallback(async (content: string) => {
    const state = store.getState()
    if (state.loading) return

    if (!clientRef.current) {
      clientRef.current = resolveClient(optionsRef.current, contextClient)
    }
    const client = clientRef.current

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    }
    state.addMessage(userMessage)
    state.setLoading(true)
    state.setError(null)

    const controller = createAbortController()
    state.setAbortController(controller)

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }
    state.addMessage(assistantMessage)

    let accumulated = ''

    try {
      const currentMessages = store.getState().messages.slice(0, -1)
      for await (const chunk of client.provider.stream(currentMessages, controller.signal)) {
        if (chunk.type === 'text' && chunk.text) {
          accumulated += chunk.text
          store.getState().updateLastAssistantMessage(accumulated)
          optionsRef.current.onToken?.(chunk.text)
        } else if (chunk.type === 'error') {
          const errMsg = chunk.error ?? 'Stream error'
          store.getState().setError(errMsg)
          optionsRef.current.onError?.(new Error(errMsg))
          break
        } else if (chunk.type === 'done') {
          break
        }
      }
      if (accumulated) {
        const finalMessage: Message = { ...assistantMessage, content: accumulated }
        optionsRef.current.onComplete?.(finalMessage)
      }
    } catch (err) {
      if (!isAbortError(err)) {
        const message = err instanceof Error ? err.message : String(err)
        store.getState().setError(message)
        optionsRef.current.onError?.(err instanceof Error ? err : new Error(message))
      }
    } finally {
      store.getState().setLoading(false)
      store.getState().setAbortController(null)
    }
  })

  const clearMessages = useCallback(() => {
    store.getState().clearMessages()
  }, [store])

  return { messages, sendMessage, loading, stop, error, clearMessages }
}
