'use client'

import { useRef, useState } from 'react'
import { useAIChat } from '@react-ai-stream/react'

export default function Page() {
  const { messages, sendMessage, loading, stop, error } = useAIChat({
    endpoint: '/api/chat',
  })
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text).then(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#111' }}>
        react-ai-stream · minimal example
      </h1>

      {/* Message list */}
      <div
        style={{
          minHeight: 300,
          maxHeight: '60vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 16,
          padding: '16px 0',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
            Send a message to start the conversation.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: msg.role === 'user' ? '#2563eb' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#111',
              border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
              color: '#9ca3af',
            }}
          >
            Thinking…
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 0' }}>
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
          }}
        />
        {loading ? (
          <button
            type="button"
            onClick={stop}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            Send
          </button>
        )}
      </form>

      <p style={{ marginTop: 24, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
        This example uses only <code>@react-ai-stream/react</code> — no UI package.
        The hook manages messages, streaming state, and abort. Bring your own components.
      </p>
    </div>
  )
}
