'use client'

import { useState } from 'react'
import { useAIChat } from '@react-ai-stream/react'
import { MessageList } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

const MODELS = [
  { model: 'llama-3.3-70b-versatile',                  label: 'Llama 3.3 · 70B',  badge: 'Groq · balanced',  color: '#f59e0b' },
  { model: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout',    badge: 'Groq · newest',    color: '#3B5BFF' },
  { model: 'compound-beta',                             label: 'Compound Beta',     badge: 'Groq · agentic',   color: '#e879f9' },
]

const SUGGESTIONS = [
  'Explain React Server Components in 3 sentences',
  'Write a haiku about TypeScript',
  'What is the difference between SSE and WebSockets?',
  'Give me a one-liner to reverse a string in Python',
]

export function DemoChat() {
  const [input, setInput] = useState('')

  const chats = [
    useAIChat({ endpoint: '/api/chat', body: { provider: 'groq', model: MODELS[0]!.model } }),
    useAIChat({ endpoint: '/api/chat', body: { provider: 'groq', model: MODELS[1]!.model } }),
    useAIChat({ endpoint: '/api/chat', body: { provider: 'groq', model: MODELS[2]!.model } }),
  ]

  const anyLoading = chats.some((c) => c.loading)

  function send(text: string) {
    if (!text.trim() || anyLoading) return
    setInput('')
    chats.forEach((c) => c.sendMessage(text.trim()))
  }

  function stopAll() {
    chats.forEach((c) => c.stop())
  }

  return (
    <div>
      <div className="model-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>
        {MODELS.map((m, i) => {
          const chat = chats[i]!
          return (
            <div key={m.model} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{m.label}</span>
                <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 20 }}>{m.badge}</span>
                {chat.loading && (
                  <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite', flexShrink: 0 }} />
                )}
              </div>
              {chat.error && (
                <div style={{ padding: '6px 14px', background: '#fef2f2', color: '#dc2626', fontSize: 12, flexShrink: 0 }}>
                  {chat.error}
                </div>
              )}
              <div style={{ height: 380, overflowY: 'auto', flex: 1 }}>
                {chat.messages.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
                    Waiting for a message…
                  </div>
                ) : (
                  <MessageList messages={chat.messages} loading={chat.loading} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Suggestions */}
      {chats.every((c) => c.messages.length === 0) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 20, background: '#fff', cursor: 'pointer', color: '#374151' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Shared input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          placeholder="Ask all three models at once…"
          disabled={anyLoading}
          style={{ flex: 1, padding: '11px 16px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}
        />
        {anyLoading ? (
          <button onClick={stopAll} style={{ padding: '11px 22px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            Stop all
          </button>
        ) : (
          <button onClick={() => send(input)} disabled={!input.trim()} style={{ padding: '11px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: !input.trim() ? 0.5 : 1 }}>
            Send to all
          </button>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </div>
  )
}
