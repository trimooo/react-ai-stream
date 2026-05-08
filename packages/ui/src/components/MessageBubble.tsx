import type { Message } from '@react-ai-stream/core'
import { MarkdownRenderer } from './MarkdownRenderer.js'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`ras-message ras-message--${message.role}`}>
      <div className="ras-message__bubble">
        {isUser ? (
          <p className="ras-message__text">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  )
}
