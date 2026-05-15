'use client'

import { useState } from 'react'

// ── curl parser ───────────────────────────────────────────────────────────────

function parseCurl(input: string): { url: string; headers: string; body: string } | null {
  const s = input.replace(/\\\s*\n\s*/g, ' ').trim()
  if (!/^curl\b/i.test(s)) return null

  const urlRe = /(?:^curl\s+(?:[^'"a-z\-][^\s]*\s+)*)(?:'(https?:\/\/[^']+)'|"(https?:\/\/[^"]+)"|(https?:\/\/[^\s]+))/i
  const urlMatch = s.match(urlRe) ?? s.match(/(https?:\/\/[^\s'"]+)/)
  const url = (urlMatch?.[1] || urlMatch?.[2] || urlMatch?.[3] || '').trim()
  if (!url) return null

  const headers: Record<string, string> = {}
  const hRe = /(?:-H|--header)\s+(?:'([^']+)'|"([^"]+)")/g
  let m: RegExpExecArray | null
  while ((m = hRe.exec(s)) !== null) {
    const h = m[1] || m[2] || ''
    const colon = h.indexOf(':')
    if (colon > 0) headers[h.slice(0, colon).trim()] = h.slice(colon + 1).trim()
  }

  const dRe = /(?:-d|--data(?:-raw|-binary)?)\s+(?:'([^']*(?:''[^']*)*)'|"((?:[^"\\]|\\.)*)")/
  const dMatch = dRe.exec(s)
  let body = dMatch?.[1] || dMatch?.[2] || ''
  try { body = JSON.stringify(JSON.parse(body), null, 2) } catch {}

  return { url, headers: JSON.stringify(headers, null, 2), body }
}

export interface EndpointConfig {
  url: string
  headers: string  // raw JSON string
  body: string     // raw JSON string
}

interface EndpointFormProps {
  onSubmit: (url: string, headers: Record<string, string>, body: unknown) => void
  onConfigChange?: (cfg: EndpointConfig) => void
  disabled?: boolean
  defaultUrl?: string | undefined
  defaultHeaders?: string | undefined
  defaultBody?: string | undefined
  compact?: boolean | undefined
}

const DEFAULT_BODY = JSON.stringify(
  { messages: [{ role: 'user', content: 'Hello! Tell me a fun fact.' }] },
  null, 2
)

interface Preset {
  id: string
  name: string
  color: string
  url: string
  headers: string
  body: string
}

const PRESETS: Preset[] = [
  {
    id: 'local-rais',
    name: 'Local Demo',
    color: '#22c55e',
    url: 'http://localhost:3002/api/rais-demo',
    headers: '{}',
    body: JSON.stringify({ messages: [{ role: 'user', content: 'What is react-ai-stream?' }] }, null, 2),
  },
  {
    id: 'groq',
    name: 'Groq',
    color: '#f59e0b',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: JSON.stringify({ Authorization: 'Bearer YOUR_GROQ_API_KEY' }, null, 2),
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Hello!' }], stream: true }, null, 2),
  },
  {
    id: 'openai',
    name: 'OpenAI',
    color: '#10b981',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: JSON.stringify({ Authorization: 'Bearer YOUR_OPENAI_API_KEY' }, null, 2),
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Hello!' }], stream: true }, null, 2),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: '#e879f9',
    url: 'https://api.anthropic.com/v1/messages',
    headers: JSON.stringify({ 'x-api-key': 'YOUR_ANTHROPIC_API_KEY', 'anthropic-version': '2023-06-01' }, null, 2),
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages: [{ role: 'user', content: 'Hello!' }], stream: true }, null, 2),
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    color: '#76b900',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    headers: JSON.stringify({ Authorization: 'Bearer YOUR_NVAPI_KEY' }, null, 2),
    body: JSON.stringify({ model: 'nvidia/llama-3.1-nemotron-70b-instruct', messages: [{ role: 'user', content: 'Hello!' }], stream: true, max_tokens: 512 }, null, 2),
  },
  {
    id: 'ollama',
    name: 'Ollama',
    color: '#94a3b8',
    url: 'http://localhost:11434/api/chat',
    headers: '{}',
    body: JSON.stringify({ model: 'llama3.2', messages: [{ role: 'user', content: 'Hello!' }], stream: true }, null, 2),
  },
]

export function EndpointForm({
  onSubmit, onConfigChange, disabled = false,
  defaultUrl = '', defaultHeaders = '{}', defaultBody = DEFAULT_BODY,
  compact = false,
}: EndpointFormProps) {
  const [url, setUrl] = useState(defaultUrl)
  const [headers, setHeaders] = useState(defaultHeaders)
  const [body, setBody] = useState(defaultBody)
  const [headersError, setHeadersError] = useState<string | null>(null)
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [showCurlImport, setShowCurlImport] = useState(false)
  const [curlInput, setCurlInput] = useState('')
  const [curlError, setCurlError] = useState<string | null>(null)

  function applyCurl() {
    const result = parseCurl(curlInput)
    if (!result) { setCurlError('Could not parse. Paste a valid curl command starting with "curl https://…"'); return }
    setUrl(result.url)
    setHeaders(result.headers)
    if (result.body) setBody(result.body)
    setHeadersError(null)
    setBodyError(null)
    setCurlError(null)
    setCurlInput('')
    setShowCurlImport(false)
    onConfigChange?.({ url: result.url, headers: result.headers, body: result.body || body })
  }

  function applyPreset(p: Preset) {
    setUrl(p.url)
    setHeaders(p.headers)
    setBody(p.body)
    setHeadersError(null)
    setBodyError(null)
    onConfigChange?.({ url: p.url, headers: p.headers, body: p.body })
  }

  function handleChange(field: 'url' | 'headers' | 'body', value: string) {
    if (field === 'url') setUrl(value)
    if (field === 'headers') { setHeaders(value); setHeadersError(null) }
    if (field === 'body') { setBody(value); setBodyError(null) }
    onConfigChange?.({
      url: field === 'url' ? value : url,
      headers: field === 'headers' ? value : headers,
      body: field === 'body' ? value : body,
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let parsedHeaders: Record<string, string>
    let parsedBody: unknown
    try {
      parsedHeaders = JSON.parse(headers) as Record<string, string>
      setHeadersError(null)
    } catch {
      setHeadersError('Invalid JSON')
      return
    }
    try {
      parsedBody = JSON.parse(body)
      setBodyError(null)
    } catch {
      setBodyError('Invalid JSON')
      return
    }
    onSubmit(url.trim(), parsedHeaders, parsedBody)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 16 }}>
      {!compact && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Presets</div>
            <button type="button" onClick={() => { setShowCurlImport(v => !v); setCurlError(null) }} disabled={disabled}
              style={{ fontSize: 11, color: showCurlImport ? '#93c5fd' : '#475569', background: showCurlImport ? 'rgba(59,91,255,0.15)' : 'transparent', border: `1px solid ${showCurlImport ? 'rgba(59,91,255,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}>
              ↓ Import curl
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                disabled={disabled}
                style={{
                  padding: '4px 11px',
                  borderRadius: 12,
                  border: `1px solid ${p.color}44`,
                  background: `${p.color}14`,
                  color: p.color,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          {showCurlImport && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(59,91,255,0.06)', border: '1px solid rgba(59,91,255,0.2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>Paste a curl command — URL, headers, and body will be extracted automatically.</div>
              <textarea
                value={curlInput}
                onChange={e => { setCurlInput(e.target.value); setCurlError(null) }}
                rows={4}
                placeholder={'curl \'https://api.example.com/chat\' \\\n  -H \'Authorization: Bearer sk-...\' \\\n  -d \'{"messages":[...]}\''}
                style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', fontSize: 11, resize: 'vertical', marginBottom: 8 }}
              />
              {curlError && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{curlError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={applyCurl} disabled={!curlInput.trim()}
                  style={{ padding: '6px 14px', background: '#3B5BFF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: curlInput.trim() ? 'pointer' : 'not-allowed', opacity: curlInput.trim() ? 1 : 0.5 }}>
                  Parse & Apply
                </button>
                <button type="button" onClick={() => { setShowCurlImport(false); setCurlInput(''); setCurlError(null) }}
                  style={{ padding: '6px 14px', background: 'transparent', color: '#475569', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label style={labelStyle}>Endpoint URL</label>
        <input
          type="url"
          value={url}
          onChange={e => handleChange('url', e.target.value)}
          placeholder="https://your-api.com/chat"
          required
          disabled={disabled}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Headers <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none' }}>(JSON)</span></label>
        <textarea
          value={headers}
          onChange={e => handleChange('headers', e.target.value)}
          rows={compact ? 2 : 3}
          disabled={disabled}
          style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', resize: 'vertical' }}
        />
        {headersError && <div style={{ marginTop: 4, fontSize: 11, color: '#ef4444' }}>{headersError}</div>}
      </div>

      <div>
        <label style={labelStyle}>Request body <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none' }}>(JSON)</span></label>
        <textarea
          value={body}
          onChange={e => handleChange('body', e.target.value)}
          rows={compact ? 3 : 5}
          disabled={disabled}
          style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', resize: 'vertical' }}
        />
        {bodyError && <div style={{ marginTop: 4, fontSize: 11, color: '#ef4444' }}>{bodyError}</div>}
      </div>

      <button
        type="submit"
        disabled={disabled || !url.trim()}
        style={{
          padding: compact ? '8px 18px' : '10px 24px',
          background: disabled ? 'rgba(59,91,255,0.4)' : '#3B5BFF',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {disabled ? 'Streaming…' : 'Inspect Stream →'}
      </button>
    </form>
  )
}

export { PRESETS }

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: '#e2e8f0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}
