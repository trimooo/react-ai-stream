import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAIChat } from '@react-ai-stream/react'

type Provider = 'groq' | 'openai' | 'anthropic'

const PROVIDER_META: Record<Provider, { label: string; hint: string; keyUrl: string; model: string; color: string }> = {
  groq: {
    label: 'Groq (free)',
    hint: 'Llama 3.3 70B — fastest, free tier available',
    keyUrl: 'https://console.groq.com/keys',
    model: 'llama-3.3-70b-versatile',
    color: '#f87171',
  },
  openai: {
    label: 'OpenAI',
    hint: 'GPT-4o mini',
    keyUrl: 'https://platform.openai.com/api-keys',
    model: 'gpt-4o-mini',
    color: '#34d399',
  },
  anthropic: {
    label: 'Anthropic',
    hint: 'Claude Haiku 4.5',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    model: 'claude-haiku-4-5-20251001',
    color: '#a78bfa',
  },
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: 0.4,
          animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </span>
  )
}

function KeyForm({ onSubmit, isDark }: { onSubmit: (provider: Provider, key: string) => void; isDark: boolean }) {
  const [provider, setProvider] = useState<Provider>('groq')
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const surface = isDark ? '#0f172a' : '#ffffff'
  const border = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textMuted = isDark ? '#94a3b8' : '#64748b'
  const codeBg = isDark ? '#1e293b' : '#f1f5f9'
  const meta = PROVIDER_META[provider]

  return (
    <div style={{ padding: '24px', background: surface }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>
          Test with a real AI model
        </div>
        <div style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.55 }}>
          Enter your API key — it stays in your browser and is never stored or logged.
        </div>
      </div>

      {/* Provider tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(Object.keys(PROVIDER_META) as Provider[]).map(p => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            style={{
              padding: '5px 12px', borderRadius: 20, border: `1px solid ${provider === p ? PROVIDER_META[p].color : border}`,
              background: provider === p ? PROVIDER_META[p].color + '22' : 'transparent',
              color: provider === p ? PROVIDER_META[p].color : textMuted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {PROVIDER_META[p].label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
        {meta.hint} ·{' '}
        <a href={meta.keyUrl} target="_blank" rel="noreferrer" style={{ color: meta.color }}>
          Get a free key ↗
        </a>
      </div>

      {/* Key input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder={`Paste your ${provider === 'groq' ? 'gsk_...' : provider === 'openai' ? 'sk-...' : 'sk-ant-...'} key`}
            onKeyDown={e => e.key === 'Enter' && key.trim() && onSubmit(provider, key.trim())}
            style={{
              width: '100%', padding: '9px 36px 9px 12px', borderRadius: 8, fontSize: 13,
              border: `1px solid ${border}`, background: codeBg, color: textPrimary,
              outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => setShowKey(v => !v)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 13,
            }}
          >
            {showKey ? '🙈' : '👁'}
          </button>
        </div>
        <button
          onClick={() => key.trim() && onSubmit(provider, key.trim())}
          disabled={!key.trim()}
          style={{
            padding: '9px 16px', borderRadius: 8, border: 'none', cursor: key.trim() ? 'pointer' : 'default',
            background: key.trim() ? meta.color : (isDark ? '#334155' : '#e2e8f0'),
            color: key.trim() ? '#fff' : textMuted,
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          Start →
        </button>
      </div>

      <div style={{ fontSize: 11.5, color: textMuted, background: codeBg, padding: '8px 12px', borderRadius: 6 }}>
        🔒 Key used only for this session — clears on page refresh. No account needed for Groq free tier.
      </div>
    </div>
  )
}

function ChatUI({ provider, apiKey, onClear, isDark }: {
  provider: Provider; apiKey: string; onClear: () => void; isDark: boolean
}) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const meta = PROVIDER_META[provider]

  const { messages, sendMessage, loading, stop, error } = useAIChat({
    endpoint: '/api/chat',
    headers: { 'x-api-key': apiKey, 'x-provider': provider },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback((text: string) => {
    const t = text.trim()
    if (!t || loading) return
    setInput('')
    sendMessage(t)
  }, [loading, sendMessage])

  const bg = isDark ? '#0f172a' : '#f8fafc'
  const surface = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textMuted = isDark ? '#94a3b8' : '#64748b'
  const inputBg = isDark ? '#0f172a' : '#ffffff'
  const aiBg = isDark ? '#1e293b' : '#f1f5f9'
  const aiText = isDark ? '#e2e8f0' : '#1e293b'

  return (
    <>
      {/* Sub-header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: isDark ? '#0f172a' : '#f8fafc',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 12, color: textMuted }}>
            Live · {meta.label} · {meta.model}
          </span>
        </div>
        <button
          onClick={onClear}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: textMuted, fontFamily: 'inherit' }}
        >
          Change key ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        height: 300, overflowY: 'auto', padding: '16px', display: 'flex',
        flexDirection: 'column', gap: 12, background: bg,
      }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: textMuted }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{meta.color === '#f87171' ? '⚡' : meta.color === '#34d399' ? '✦' : '◈'}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>
              Connected to {meta.label}
            </div>
            <div style={{ fontSize: 12.5 }}>Ask anything — real AI streaming via RAIS protocol.</div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%', padding: '9px 13px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.6,
              background: msg.role === 'user' ? meta.color : aiBg,
              color: msg.role === 'user' ? '#ffffff' : aiText,
              borderBottomRightRadius: msg.role === 'user' ? 3 : 12,
              borderBottomLeftRadius: msg.role === 'assistant' ? 3 : 12,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
              {msg.role === 'assistant' && loading && msg === messages[messages.length - 1] && (
                <span style={{
                  display: 'inline-block', width: 6, height: 13,
                  background: meta.color, borderRadius: 1, marginLeft: 2,
                  verticalAlign: 'text-bottom', animation: 'typingDot 0.8s ease-in-out infinite',
                }} />
              )}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div style={{ display: 'flex' }}>
            <div style={{ padding: '9px 13px', background: aiBg, borderRadius: 12, borderBottomLeftRadius: 3, color: aiText }}>
              <TypingDots />
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12.5, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: `1px solid ${border}`, background: surface }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          placeholder={`Ask ${meta.label} anything…`}
          disabled={loading}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13.5,
            border: `1px solid ${border}`, background: inputBg, color: textPrimary,
            outline: 'none', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
          }}
        />
        {loading ? (
          <button onClick={stop} style={{
            padding: '9px 14px', borderRadius: 8, background: '#ef4444',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit',
          }}>Stop ■</button>
        ) : (
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            style={{
              padding: '9px 14px', borderRadius: 8, border: 'none',
              background: input.trim() ? meta.color : (isDark ? '#334155' : '#e2e8f0'),
              color: input.trim() ? '#fff' : textMuted,
              cursor: input.trim() ? 'pointer' : 'default',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}
          >Send ↑</button>
        )}
      </div>
    </>
  )
}

export default function LiveDemoReal() {
  const [mounted, setMounted] = useState(false)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Restore from sessionStorage (clears on tab close)
    try {
      const saved = sessionStorage.getItem('rais_demo_provider')
      const savedKey = sessionStorage.getItem('rais_demo_key')
      if (saved && savedKey) { setProvider(saved as Provider); setApiKey(savedKey) }
    } catch { /* ignore */ }
  }, [])

  if (!mounted) return null

  const isDark = typeof window !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'

  const surface = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? '#334155' : '#e2e8f0'

  const handleSubmit = (p: Provider, key: string) => {
    setProvider(p); setApiKey(key)
    try { sessionStorage.setItem('rais_demo_provider', p); sessionStorage.setItem('rais_demo_key', key) } catch { /* ignore */ }
  }

  const handleClear = () => {
    setProvider(null); setApiKey(null)
    try { sessionStorage.removeItem('rais_demo_provider'); sessionStorage.removeItem('rais_demo_key') } catch { /* ignore */ }
  }

  return (
    <>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 0.9; }
        }
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
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: provider ? '#22c55e' : '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
              Real AI Demo
            </span>
          </div>
          <span style={{
            fontSize: 11, color: isDark ? '#94a3b8' : '#64748b',
            background: isDark ? '#1e293b' : '#e2e8f0',
            padding: '2px 8px', borderRadius: 20, fontWeight: 500,
          }}>
            RAIS protocol · your key
          </span>
        </div>

        {provider && apiKey
          ? <ChatUI provider={provider} apiKey={apiKey} onClear={handleClear} isDark={isDark} />
          : <KeyForm onSubmit={handleSubmit} isDark={isDark} />
        }
      </div>
    </>
  )
}
