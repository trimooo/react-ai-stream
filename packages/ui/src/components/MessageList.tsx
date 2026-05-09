import { useEffect, useRef } from 'react'
import type { Message } from '@react-ai-stream/core'
import { MessageBubble } from './MessageBubble.js'

interface MessageListProps {
  messages: Message[]
  loading?: boolean
}

export function MessageList({ messages, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="ras-message-list">
      {messages
        .filter((m) => m.role !== 'system')
        .map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      {loading && (
        <div className="ras-message ras-message--assistant">
          <div className="ras-message__bubble ras-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
