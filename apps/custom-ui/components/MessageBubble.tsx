import type { Message } from '@react-ai-stream/core'

interface MessageBubbleProps {
  message: Message
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ring-1 ${
          isUser
            ? 'bg-indigo-600 text-white ring-indigo-500'
            : 'bg-gray-700 text-gray-300 ring-gray-600'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble + timestamp */}
      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
          }`}
        >
          {message.content || (
            <span className="text-gray-500 italic text-xs">Generating…</span>
          )}
        </div>
        <span className="text-xs text-gray-600 px-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
