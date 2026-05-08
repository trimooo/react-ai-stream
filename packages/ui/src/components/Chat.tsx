import type { Message } from '@react-ai-stream/core'
import { MessageList } from './MessageList.js'
import { ChatInput } from './ChatInput.js'

interface ChatProps {
  messages: Message[]
  onSend: (message: string) => void
  onStop?: () => void
  loading?: boolean
  placeholder?: string
  className?: string
}

export function Chat({ messages, onSend, onStop, loading, placeholder, className }: ChatProps) {
  const lastMessage = messages[messages.length - 1]
  const showTyping = loading === true && (!lastMessage || lastMessage.role !== 'assistant' || lastMessage.content === '')

  return (
    <div className={`ras-chat ${className ?? ''}`}>
      <MessageList messages={messages} loading={showTyping} />
      <ChatInput onSend={onSend} onStop={onStop} loading={loading} placeholder={placeholder} />
    </div>
  )
}
