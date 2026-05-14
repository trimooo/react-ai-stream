'use client'
import { Chat } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'
import { useAIChat } from '@react-ai-stream/react'

export default function Page() {
  const chat = useAIChat({ endpoint: '/api/chat' })
  return (
    <main style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Chat {...chat} placeholder="Ask anything…" />
    </main>
  )
}
