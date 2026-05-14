'use client'
import { useAIChat } from '@react-ai-stream/react'
import { useState } from 'react'

export default function Page() {
  const { messages, sendMessage, loading, stop, error } = useAIChat({ endpoint: '/api/chat' })
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        __PROJECT_NAME__
      </h1>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', minHeight: 120 }}>
        {messages
          .filter((m) => m.role !== 'system')
          .map((m) => (
            <li
              key={m.id}
              style={{
                marginBottom: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                background: m.role === 'user' ? '#f3f4f6' : '#fff',
                border: '1px solid #e5e7eb',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#9ca3af',
                  marginBottom: 4,
                }}
              >
                {m.role}
              </span>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{m.content}</p>
            </li>
          ))}
        {loading && (
          <li style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '0.5rem 0' }}>
            Thinking…
          </li>
        )}
      </ul>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.6rem 0.875rem',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        {loading ? (
          <button
            type="button"
            onClick={stop}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 6,
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 6,
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              opacity: input.trim() ? 1 : 0.5,
            }}
          >
            Send
          </button>
        )}
      </form>
    </main>
  )
}
