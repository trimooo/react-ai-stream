'use client'

import { useEffect, useRef } from 'react'
import { useAIChat } from '@react-ai-stream/react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

interface Model {
  readonly id: string
  readonly name: string
  readonly tag: string
}

interface ChatPanelProps {
  model: Model
}

export function ChatPanel({ model }: ChatPanelProps) {
  const { messages, sendMessage, loading, stop } = useAIChat({
    endpoint: `/api/chat?model=${encodeURIComponent(model.id)}`,
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-gray-800">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-100 truncate">{model.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">via Groq · {model.tag}</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-indigo-400">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-xs">Streaming</span>
          </div>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 6a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H7l-4 3V6z" stroke="#6b7280" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Start a conversation</p>
              <p className="text-xs text-gray-600 mt-1">Talking to {model.name}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {/* Typing indicator when streaming starts but assistant message is empty */}
        {loading && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 ring-1 ring-gray-600 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
              AI
            </div>
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} onStop={stop} loading={loading} />
    </div>
  )
}
