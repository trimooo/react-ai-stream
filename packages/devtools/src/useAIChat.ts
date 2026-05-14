import { useCallback, useRef } from 'react'
import { useAIChat as _useAIChat } from '@react-ai-stream/react'
import type { UseAIChatOptions, UseAIChatCallbacks } from '@react-ai-stream/core'
import { devStore } from './store.js'

let counter = 0

/**
 * Drop-in replacement for `useAIChat` that emits telemetry to the RAIS DevTools panel.
 * API is identical — swap the import and add `<RAISDevTools />` to your app root.
 */
export function useAIChat(options: UseAIChatOptions & UseAIChatCallbacks) {
  const chatId = useRef(`chat-${++counter}`).current

  const result = _useAIChat({
    ...options,
    onToken: (token) => {
      devStore.onToken(chatId)
      options.onToken?.(token)
    },
    onComplete: (message) => {
      devStore.onComplete(chatId)
      options.onComplete?.(message)
    },
    onError: (error) => {
      devStore.onError(chatId, error.message)
      options.onError?.(error)
    },
  })

  // Keep stable refs so wrappers don't change identity on each render
  const sendRef = useRef(result.sendMessage)
  sendRef.current = result.sendMessage
  const stopRef = useRef(result.stop)
  stopRef.current = result.stop

  const sendMessage = useCallback(
    async (content: string) => {
      devStore.onSend(chatId, content)
      return sendRef.current(content)
    },
    [chatId],
  )

  const stop = useCallback(() => {
    devStore.onAbort(chatId)
    stopRef.current()
  }, [chatId])

  return { ...result, sendMessage, stop }
}
