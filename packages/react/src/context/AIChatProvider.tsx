import { type ReactNode } from 'react'
import type { AIClient } from '@react-ai-stream/core'
import { AIChatContext } from './AIChatContext.js'

interface AIChatProviderProps {
  client: AIClient
  children: ReactNode
}

export function AIChatProvider({ client, children }: AIChatProviderProps) {
  return <AIChatContext.Provider value={client}>{children}</AIChatContext.Provider>
}
