'use client'

import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { parseSSE } from '@react-ai-stream/core'

// ── provider definitions ──────────────────────────────────────────────────────

type MsgRole = 'user' | 'assistant' | 'system'
interface ApiMessage { role: MsgRole; content: string }

interface ChatProviderDef {
  id: string
  name: string
  color: string
  url: string           // absolute URL for external call through proxy
  directUrl?: string    // relative URL for same-origin direct call (skips proxy)
  keyPlaceholder: string
  needsKey: boolean
  models: { id: string; label: string }[]
  buildBody: (messages: ApiMessage[], model: string, system: string) => Record<string, unknown>
  buildHeaders: (key: string) => Record<string, string>
  extractText: (parsed: Record<string, unknown>) => string | null
  isDone: (parsed: Record<string, unknown>) => boolean
}

// ── text extractors ───────────────────────────────────────────────────────────

function openAIExtract(d: Record<string, unknown>): string | null {
  const choices = d.choices as Array<{ delta?: { content?: string }; finish_reason?: string | null }> | undefined
  const content = choices?.[0]?.delta?.content
  return typeof content === 'string' && content.length > 0 ? content : null
}
function openAIDone(d: Record<string, unknown>): boolean {
  const choices = d.choices as Array<{ finish_reason?: string | null }> | undefined
  const reason = choices?.[0]?.finish_reason
  return reason === 'stop' || reason === 'length'
}
function anthropicExtract(d: Record<string, unknown>): string | null {
  if (d.type !== 'content_block_delta') return null
  const delta = d.delta as { type?: string; text?: string } | undefined
  return delta?.type === 'text_delta' && typeof delta.text === 'string' ? delta.text : null
}
function anthropicDone(d: Record<string, unknown>): boolean {
  return d.type === 'message_stop'
}
function raisExtract(d: Record<string, unknown>): string | null {
  return d.type === 'text' && typeof d.text === 'string' ? d.text : null
}
function raisDone(d: Record<string, unknown>): boolean {
  return d.type === 'done'
}

// ── providers ─────────────────────────────────────────────────────────────────

const PROVIDERS: ChatProviderDef[] = [
  {
    id: 'groq',
    name: 'Groq',
    color: '#f59e0b',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    keyPlaceholder: 'gsk_…',
    needsKey: true,
    models: [
      { id: 'llama-3.3-70b-versatile',  label: 'Llama 3.3 70B (best)' },
      { id: 'llama-3.1-8b-instant',     label: 'Llama 3.1 8B (fastest)' },
      { id: 'llama3-70b-8192',          label: 'Llama 3 70B' },
      { id: 'mixtral-8x7b-32768',       label: 'Mixtral 8x7B (32K ctx)' },
      { id: 'gemma2-9b-it',             label: 'Gemma 2 9B' },
    ],
    buildBody: (msgs, model) => ({ model, messages: msgs, stream: true }),
    buildHeaders: (k) => ({ Authorization: `Bearer ${k}` }),
    extractText: openAIExtract,
    isDone: openAIDone,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    color: '#10b981',
    url: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-…',
    needsKey: true,
    models: [
      { id: 'gpt-4o-mini',   label: 'GPT-4o mini' },
      { id: 'gpt-4o',        label: 'GPT-4o' },
      { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    buildBody: (msgs, model) => ({ model, messages: msgs, stream: true }),
    buildHeaders: (k) => ({ Authorization: `Bearer ${k}` }),
    extractText: openAIExtract,
    isDone: openAIDone,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: '#e879f9',
    url: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-ant-…',
    needsKey: true,
    models: [
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku (fast)' },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
    ],
    buildBody: (msgs, model, system) => {
      const filtered = msgs.filter(m => m.role !== 'system')
      return { model, max_tokens: 2048, messages: filtered, stream: true, ...(system ? { system } : {}) }
    },
    buildHeaders: (k) => ({ 'x-api-key': k, 'anthropic-version': '2023-06-01' }),
    extractText: anthropicExtract,
    isDone: anthropicDone,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    color: '#76b900',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    keyPlaceholder: 'nvapi-…',
    needsKey: true,
    models: [
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct',   label: 'Nemotron 70B' },
      { id: 'mistralai/mixtral-8x7b-instruct-v0.1',     label: 'Mixtral 8x7B' },
      { id: 'mistralai/mistral-7b-instruct-v0.3',       label: 'Mistral 7B' },
      { id: 'microsoft/phi-3-mini-128k-instruct',       label: 'Phi-3 Mini 128K' },
      { id: 'google/gemma-2-9b-it',                     label: 'Gemma 2 9B' },
    ],
    buildBody: (msgs, model) => ({
      model,
      messages: msgs,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 1,
    }),
    buildHeaders: (k) => ({
      Authorization: `Bearer ${k}`,
      Accept: 'text/event-stream',
    }),
    extractText: openAIExtract,
    isDone: openAIDone,
  },
  {
    id: 'local-rais',
    name: 'Local Demo',
    color: '#22c55e',
    url: 'http://localhost:3002/api/rais-demo',  // used by inspect/benchmark tools
    directUrl: '/api/rais-demo',                 // used by chat (same origin, no proxy)
    keyPlaceholder: '(no key needed)',
    needsKey: false,
    models: [{ id: 'rais-demo', label: 'Project Assistant (RAIS)' }],
    buildBody: (msgs) => ({ messages: msgs }),
    buildHeaders: () => ({}),
    extractText: raisExtract,
    isDone: raisDone,
  },
]

// ── message type ──────────────────────────────────────────────────────────────

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming: boolean
  error: string | null
}

// ── main component ────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [provider, setProvider] = useState<ChatProviderDef>(PROVIDERS[0]!)
  const [model, setModel]       = useState(PROVIDERS[0]!.models[0]!.id)
  const [apiKey, setApiKey]     = useState('')
  const [showKey, setShowKey]   = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful, concise AI assistant.')
  const [showSystem, setShowSystem] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput]       = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const abortRef    = useRef<AbortController | null>(null)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const uid = useId()

  // load saved key on provider change
  useEffect(() => {
    const saved = localStorage.getItem(`aistream_chat_key_${provider.id}`)
    setApiKey(saved ?? '')
  }, [provider.id])

  // persist key whenever it changes
  useEffect(() => {
    if (apiKey) localStorage.setItem(`aistream_chat_key_${provider.id}`, apiKey)
  }, [apiKey, provider.id])

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function switchProvider(p: ChatProviderDef) {
    setProvider(p)
    setModel(p.models[0]!.id)
    setStatusNote(null)
  }

  function clearChat() {
    abortRef.current?.abort()
    setMessages([])
    setIsStreaming(false)
    setStatusNote(null)
  }

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMsgId = `${uid}-u-${Date.now()}`
    const asstMsgId = `${uid}-a-${Date.now() + 1}`

    const userMsg: DisplayMessage = { id: userMsgId, role: 'user', content: text, streaming: false, error: null }
    const asstMsg: DisplayMessage = { id: asstMsgId, role: 'assistant', content: '', streaming: true, error: null }

    setMessages(prev => [...prev, userMsg, asstMsg])
    setInput('')
    setStatusNote(null)
    setIsStreaming(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const history: ApiMessage[] = messages
      .filter(m => !m.streaming && !m.error)
      .map(m => ({ role: m.role, content: m.content }))
    const apiMessages: ApiMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: text },
    ]

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      let res: Response

      if (provider.directUrl) {
        // same-origin endpoint — call directly, no proxy needed
        res = await fetch(provider.directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...provider.buildHeaders(apiKey) },
          body: JSON.stringify(provider.buildBody(apiMessages, model, systemPrompt)),
          signal: ctrl.signal,
        })
      } else {
        // external API — go through proxy to avoid CORS
        res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: provider.url,
            headers: provider.buildHeaders(apiKey),
            body: provider.buildBody(apiMessages, model, systemPrompt),
          }),
          signal: ctrl.signal,
        })
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText)
        // Give helpful hints for common errors
        let hint = ''
        if (res.status === 401) hint = ' — API key invalid or expired'
        else if (res.status === 429) hint = ' — rate limit hit, wait a moment'
        else if (res.status === 400) hint = ' — bad request (check model ID and body format)'
        else if (res.status === 502) hint = ' — could not reach endpoint (check URL)'
        throw new Error(`HTTP ${res.status}${hint}: ${errText.slice(0, 300)}`)
      }
      if (!res.body) throw new Error('No response body')

      let accumulated = ''

      for await (const raw of parseSSE(res.body)) {
        if (ctrl.signal.aborted) break
        if (raw === '[DONE]' || raw.trim() === '') continue
        try {
          const d = JSON.parse(raw) as Record<string, unknown>
          if (provider.isDone(d)) break
          const chunk = provider.extractText(d)
          if (chunk) {
            accumulated += chunk
            setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: accumulated } : m))
          }
        } catch { /* skip malformed frames */ }
      }

      setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, streaming: false } : m))
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, streaming: false } : m))
      } else {
        const errMsg = err instanceof Error ? err.message : String(err)
        setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, streaming: false, error: errMsg } : m))
        if (provider.id === 'nvidia') {
          setStatusNote('NVIDIA NIM tip: make sure your nvapi- key has credits and the model is available in your region. Try Mistral 7B or Phi-3 Mini if Nemotron 70B fails.')
        }
      }
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, messages, provider, model, apiKey, systemPrompt, uid])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const hasKey = !provider.needsKey || apiKey.trim().length > 0
  const canSend = input.trim().length > 0 && hasKey && !isStreaming

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 54px)', background: '#020817' }}>

      {/* ── top bar ────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(2,8,23,0.95)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10, height: 52, flexShrink: 0, overflowX: 'auto' }}>
        {/* provider tabs */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => switchProvider(p)}
              style={{
                padding: '4px 11px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: provider.id === p.id ? `${p.color}22` : 'transparent',
                color: provider.id === p.id ? p.color : '#475569',
                transition: 'all 0.12s',
              }}
            >
              {p.name}
              {p.id === 'local-rais' && (
                <span style={{ marginLeft: 4, fontSize: 9, background: '#22c55e22', color: '#22c55e', borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>RAIS</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* model dropdown */}
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
        >
          {provider.models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>

        {/* API key */}
        {provider.needsKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, maxWidth: 300, minWidth: 120 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={provider.keyPlaceholder}
              autoComplete="off"
              style={{
                flex: 1, fontSize: 12, padding: '4px 9px',
                background: apiKey ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${apiKey ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: 6, color: '#e2e8f0', outline: 'none',
                fontFamily: 'ui-monospace, monospace',
              }}
            />
            <button onClick={() => setShowKey(v => !v)} style={{ fontSize: 11, padding: '3px 7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#475569', cursor: 'pointer', flexShrink: 0 }}>
              {showKey ? 'hide' : 'show'}
            </button>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setShowSystem(v => !v)}
            style={{ padding: '4px 10px', fontSize: 11, background: showSystem ? 'rgba(59,91,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showSystem ? 'rgba(59,91,255,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, color: showSystem ? '#93c5fd' : '#475569', cursor: 'pointer', fontWeight: 600 }}
          >
            System
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{ padding: '4px 10px', fontSize: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#fca5a5', cursor: 'pointer', fontWeight: 600 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── system prompt panel ─────────────────────────────────────────────── */}
      {showSystem && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(59,91,255,0.04)', padding: '12px 24px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>System Prompt</div>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={2}
            placeholder="You are a helpful AI assistant."
            style={{ width: '100%', padding: '8px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          {provider.id === 'local-rais' && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#334155' }}>
              Local Demo ignores the system prompt — it has built-in knowledge about the react-ai-stream project.
            </div>
          )}
        </div>
      )}

      {/* ── messages ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        {messages.length === 0 ? (
          <WelcomeScreen provider={provider} hasKey={hasKey} onSuggestion={s => { setInput(s); textareaRef.current?.focus() }} />
        ) : (
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} providerColor={provider.color} />
            ))}
            {statusNote && (
              <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: '#fcd34d' }}>
                {statusNote}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── input bar ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(2,8,23,0.96)', padding: '14px 24px 18px', flexShrink: 0 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {!hasKey && (
            <div style={{ marginBottom: 8, fontSize: 12, color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '6px 12px' }}>
              Enter your {provider.name} API key in the bar above to start chatting.
            </div>
          )}
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${isStreaming ? `${provider.color}50` : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 14, padding: '12px 14px',
            transition: 'border-color 0.2s',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || !hasKey}
              placeholder={hasKey ? `Message ${provider.name}… (Enter ↵ to send, Shift+Enter for new line)` : `Enter your ${provider.name} API key first`}
              rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', resize: 'none', lineHeight: 1.6, minHeight: 24, maxHeight: 200 }}
            />
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'flex-end' }}>
              {isStreaming ? (
                <button
                  onClick={() => { abortRef.current?.abort(); setIsStreaming(false) }}
                  style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ■ Stop
                </button>
              ) : (
                <button
                  onClick={() => void send()}
                  disabled={!canSend}
                  style={{
                    padding: '7px 20px',
                    background: canSend ? provider.color : 'rgba(255,255,255,0.04)',
                    border: 'none', borderRadius: 8,
                    color: canSend ? '#fff' : '#334155',
                    fontSize: 13, fontWeight: 700,
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                >
                  Send ↵
                </button>
              )}
            </div>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#1e293b', textAlign: 'center' }}>
            {provider.name} · {provider.models.find(m => m.id === model)?.label ?? model}
            {provider.needsKey && ' · key stored in your browser only'}
            {provider.id === 'local-rais' && ' · runs in this tab, no external API'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function WelcomeScreen({ provider, hasKey, onSuggestion }: {
  provider: ChatProviderDef
  hasKey: boolean
  onSuggestion: (s: string) => void
}) {
  const suggestions =
    provider.id === 'local-rais'
      ? ['What is react-ai-stream?', 'Who created this project?', 'What can I build with it?', 'Explain the RAIS protocol.']
      : ['Explain SSE streaming in 3 sentences.', 'Write a Python quicksort.', 'What makes a good REST API?', 'Summarize TCP vs UDP.']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '60px 24px', textAlign: 'center', gap: 0 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${provider.color}18`, border: `1px solid ${provider.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: provider.color }} />
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em' }}>
        {provider.id === 'local-rais' ? 'react-ai-stream Assistant' : `Chat with ${provider.name}`}
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b', maxWidth: 400, lineHeight: 1.7 }}>
        {provider.id === 'local-rais'
          ? 'A built-in RAIS-compliant assistant that knows all about this project. No API key needed.'
          : hasKey
            ? 'Type below to start. Your key is stored locally and never leaves your browser.'
            : `Enter your ${provider.name} API key in the top bar to begin.`}
      </p>
      {!hasKey && provider.needsKey && (
        <div style={{ marginBottom: 20, padding: '8px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
          API key required — enter it in the top bar
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 520 }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, fontSize: 12, color: '#64748b', cursor: 'pointer', transition: 'all 0.12s' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ msg, providerColor }: { msg: DisplayMessage; providerColor: string }) {
  const isUser = msg.role === 'user'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {isUser ? 'You' : 'Assistant'}
        {msg.streaming && <span style={{ marginLeft: 6, color: providerColor }}>●</span>}
      </div>
      <div style={{
        maxWidth: '82%',
        padding: '13px 17px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        background: isUser
          ? 'rgba(59,91,255,0.12)'
          : msg.error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isUser
          ? 'rgba(59,91,255,0.25)'
          : msg.error ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
        fontSize: 14,
        color: msg.error ? '#fca5a5' : '#e2e8f0',
        lineHeight: 1.75,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.error ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>Error</div>
            <div style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.5 }}>{msg.error}</div>
          </>
        ) : (
          <>
            {msg.content}
            {msg.streaming && msg.content === '' && (
              <span style={{ color: '#475569', fontSize: 13 }}>Thinking…</span>
            )}
            {msg.streaming && (
              <span style={{
                display: 'inline-block', width: 2, height: '1em',
                background: providerColor, marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
