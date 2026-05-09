'use client'

import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  loading: boolean
}

export function ChatInput({ onSend, onStop, loading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = value.trim()
    if (!text || loading) return
    setValue('')
    onSend(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const canSend = value.trim().length > 0 && !loading

  return (
    <div className="shrink-0 border-t border-gray-800 px-4 py-4">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-end gap-3 bg-gray-800 rounded-xl px-4 py-3 border transition-colors ${
            loading ? 'border-gray-700' : 'border-gray-700 focus-within:border-indigo-500'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none outline-none max-h-40 leading-relaxed disabled:opacity-50 py-0.5"
          />

          {loading ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop generation"
              className="shrink-0 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <rect x="2.5" y="2.5" width="7" height="7" fill="white" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              title="Send message"
              className="shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2 7L12 7M12 7L7.5 2.5M12 7L7.5 11.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-2 text-center">
          Hook: <code className="font-mono">useAIChat</code> from{' '}
          <code className="font-mono">@react-ai-stream/react</code> · UI: custom Tailwind components
        </p>
      </form>
    </div>
  )
}
