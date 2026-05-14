'use client'
// Requires Tailwind CSS — set it up with: npx tailwindcss init
// or use the Tailwind v4 CSS-first approach: https://tailwindcss.com/docs/installation
import { useAIChat } from '@react-ai-stream/react'
import { useEffect, useRef, useState } from 'react'

export default function Page() {
  const { messages, sendMessage, loading, stop } = useAIChat({ endpoint: '/api/chat' })
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <h1 className="font-semibold text-sm">__PROJECT_NAME__</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter((m) => m.role !== 'system').map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-zinc-400">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-zinc-200 dark:border-zinc-700 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          disabled={loading}
          className="flex-1 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {loading ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
          >
            Send
          </button>
        )}
      </form>
    </div>
  )
}
