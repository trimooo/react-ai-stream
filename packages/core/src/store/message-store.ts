import { createStore } from 'zustand/vanilla'
import type { ChatState, ChatActions, Message } from '../types.js'

export type MessageStore = ChatState & ChatActions

export function createMessageStore() {
  return createStore<MessageStore>((set) => ({
    messages: [],
    loading: false,
    error: null,
    abortController: null,

    addMessage: (msg: Message) =>
      set((state) => ({ messages: [...state.messages, msg] })),

    updateLastAssistantMessage: (content: string) =>
      set((state) => {
        const messages = [...state.messages]
        const lastIdx = messages.length - 1
        const last = messages[lastIdx]
        if (!last || last.role !== 'assistant') return state
        messages[lastIdx] = { ...last, content }
        return { messages }
      }),

    setLoading: (loading: boolean) => set({ loading }),
    setError: (error: string | null) => set({ error }),
    setAbortController: (abortController: AbortController | null) => set({ abortController }),

    clearMessages: () => set({ messages: [], error: null }),
  }))
}
