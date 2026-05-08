import { createContext } from 'react'
import type { AIClient } from '@react-ai-stream/core'

export const AIChatContext = createContext<AIClient | null>(null)
