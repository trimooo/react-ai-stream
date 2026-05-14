import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAIChat } from '@react-ai-stream/react'

const SUGGESTIONS = [
  'What is RAIS?',
  'Show me the React hook',
  'What about Vue?',
  'Add it to Express',
  'How does compliance work?',
  'Python / FastAPI support',
]

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'currentColor', opacity: 0.4,
            animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  )
}

export default function LiveDemo() {
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, loading, stop } = useAIChat({ endpoint: '/api/demo' })

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback((text: string) => {
    const t = text.trim()
    if (!t || loading) return
    setInput('')
    sendMessage(t)
  }, [loading, sendMessage])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  if (!mounted) return null

  const isDark = typeof window !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'

  const bg = isDark ? '#0f172a' : '#f8fafc'
  const surface = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textMuted = isDark ? '#94a3b8' : '#64748b'
  const userBg = '#7c3aed'
  const aiBg = isDark ? '#1e293b' : '#f1f5f9'
  const aiText = isDark ? '#e2e8f0' : '#1e293b'
  const inputBg = isDark ? '#0f172a' : '#ffffff'

  return (
    <>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 0.9; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rais-msg { animation: fadeIn 0.18s ease-out; }
        .rais-send-btn:hover { background: #6d28d9 !important; }
        .rais-stop-btn:hover { background: #dc2626 !important; }
        .rais-chip:hover { background: ${isDark ? '#334155' : '#e2e8f0'} !important; }
      `}</style>

      <div style={{
        border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden',
        background: surface, maxWidth: 640, margin: '24px auto',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${border}`,
          background: isDark ? '#0f172a' : '#f8fafc',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>Live Demo</span>
          </div>
          <span style={{
            fontSize: 11, color: textMuted, background: isDark ? '#1e293b' : '#e2e8f0',
            padding: '2px 8px', borderRadius: 20, fontWeight: 500,
          }}>
            RAIS v1 · no API key needed
          </span>
        </div>

        {/* Messages */}
        <div style={{
          height: 340, overflowY: 'auto', padding: '16px', display: 'flex',
          flexDirection: 'column', gap: 12, background: bg,
        }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>◈</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>
                RAIS Protocol Demo
              </div>
              <div style={{ fontSize: 13 }}>
                Ask anything about the ecosystem — streaming starts instantly.
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rais-msg"
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '82%', padding: '9px 13px', borderRadius: 12,
                fontSize: 13.5, lineHeight: 1.6,
                background: msg.role === 'user' ? userBg : aiBg,
                color: msg.role === 'user' ? '#ffffff' : aiText,
                borderBottomRightRadius: msg.role === 'user' ? 3 : 12,
                borderBottomLeftRadius: msg.role === 'assistant' ? 3 : 12,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {msg.content}
                {msg.role === 'assistant' && loading && msg === messages[messages.length - 1] && (
                  <span style={{ display: 'inline-block', width: 6, height: 13, background: '#7c3aed', borderRadius: 1, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'typingDot 0.8s ease-in-out infinite' }} />
                )}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div className="rais-msg" style={{ display: 'flex' }}>
              <div style={{ padding: '9px 13px', background: aiBg, borderRadius: 12, borderBottomLeftRadius: 3, color: aiText }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 16px 6px',
            borderTop: `1px solid ${border}`, background: bg,
          }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                className="rais-chip"
                onClick={() => send(s)}
                style={{
                  fontSize: 12, padding: '4px 10px', borderRadius: 20, border: `1px solid ${border}`,
                  background: isDark ? '#1e293b' : '#f1f5f9', color: textMuted,
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          display: 'flex', gap: 8, padding: '12px 16px',
          borderTop: `1px solid ${border}`, background: surface,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about RAIS, the React hook, Vue, Express…"
            disabled={loading}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13.5,
              border: `1px solid ${border}`, background: inputBg, color: textPrimary,
              outline: 'none', fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}
          />
          {loading ? (
            <button
              className="rais-stop-btn"
              onClick={stop}
              style={{
                padding: '9px 14px', borderRadius: 8, background: '#ef4444',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'background 0.15s', whiteSpace: 'nowrap',
              }}
            >
              Stop ■
            </button>
          ) : (
            <button
              className="rais-send-btn"
              onClick={() => send(input)}
              disabled={!input.trim()}
              style={{
                padding: '9px 14px', borderRadius: 8,
                background: input.trim() ? '#7c3aed' : (isDark ? '#334155' : '#e2e8f0'),
                color: input.trim() ? '#fff' : textMuted,
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                fontSize: 13, fontWeight: 600, transition: 'background 0.15s',
              }}
            >
              Send ↑
            </button>
          )}
        </div>
      </div>
    </>
  )
}
