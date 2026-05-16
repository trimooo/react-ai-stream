'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Used only in code snippets shown to users — not for actual fetch calls.
// Actual API calls use relative paths (/api/v1/...) so they work on any host
// without CORS issues (local dev, staging, production).
const GATEWAY_DISPLAY = 'https://react-ai-stream-gateway.vercel.app'

interface UsageData {
  key_id: string
  plan: string
  monthly_limit: number
  requests_total: number
  tokens_total: number
  providers: Record<string, number>
  by_day: Record<string, number>
}

const PROVIDER_COLORS: Record<string, string> = {
  groq: '#f59e0b',
  openai: '#10b981',
  anthropic: '#e879f9',
  gemini: '#3B5BFF',
}

// ─── Shared style tokens ─────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: '22px 24px',
}

const mono: React.CSSProperties = { fontFamily: 'ui-monospace, monospace' }

const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  background: `${color}18`,
  border: `1px solid ${color}33`,
  color,
})

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [key, setKey] = useState('')
  const [draftKey, setDraftKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'overview' | 'quickstart' | 'test'>('overview')
  const [copied, setCopied] = useState('')

  // live test state
  const [testPrompt, setTestPrompt] = useState('Explain RAIS Protocol in one sentence.')
  const [testProvider, setTestProvider] = useState<'groq' | 'openai' | 'anthropic'>('groq')
  const [testOutput, setTestOutput] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle')
  const [testLatency, setTestLatency] = useState<number | null>(null)
  const [testTokens, setTestTokens] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Load key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('rais_dashboard_key')
    if (stored) { setKey(stored); setDraftKey(stored) }
  }, [])

  // Auto-load usage when key is known
  useEffect(() => {
    if (key) fetchUsage(key)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchUsage(k: string) {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch(`/api/v1/usage`, {
        headers: { Authorization: `Bearer ${k}` },
      })
      const data = await res.json()
      if (!res.ok) { setLoadError(data.error ?? `Error ${res.status}`); return }
      setUsage(data)
      setKey(k)
      localStorage.setItem('rais_dashboard_key', k)
    } catch {
      setLoadError('Could not reach RAIS Cloud. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (draftKey.trim()) fetchUsage(draftKey.trim())
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 1800)
  }

  const runTest = useCallback(async () => {
    if (!key) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setTestOutput('')
    setTestStatus('streaming')
    setTestTokens(0)
    setTestLatency(null)
    const t0 = Date.now()
    let firstByte = false

    try {
      const res = await fetch(`/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testPrompt }],
          provider: testProvider,
        }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) {
        const text = await res.text()
        setTestOutput(text)
        setTestStatus('error')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let toks = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!firstByte) { setTestLatency(Date.now() - t0); firstByte = true }
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          try {
            const chunk = JSON.parse(trimmed.slice(5).trim())
            if (chunk.type === 'text' && chunk.text) {
              toks++
              setTestTokens(t => t + 1)
              setTestOutput(o => o + chunk.text)
            }
            if (chunk.type === 'done') { setTestStatus('done'); return }
            if (chunk.type === 'error') { setTestOutput(o => o + '\n\nError: ' + chunk.error); setTestStatus('error'); return }
          } catch { /* skip */ }
        }
      }
      setTestStatus('done')
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') { setTestStatus('idle'); return }
      setTestOutput(String(err))
      setTestStatus('error')
    }
  }, [key, testPrompt, testProvider])

  const planColor = usage?.plan === 'pro' ? '#3B5BFF' : usage?.plan === 'team' ? '#e879f9' : usage?.plan === 'enterprise' ? '#f59e0b' : '#64748b'

  const recentDays = Object.entries(usage?.by_day ?? {})
    .sort(([a], [b]) => b.localeCompare(a)).slice(0, 7).reverse()
  const maxDayTokens = Math.max(...recentDays.map(([, v]) => v), 1)

  const totalProviderReqs = Object.values(usage?.providers ?? {}).reduce((a, b) => a + b, 0)

  const pct = usage && usage.monthly_limit > 0
    ? Math.min(100, (usage.tokens_total / usage.monthly_limit) * 100)
    : null

  // ─── Key Entry ───────────────────────────────────────────────────────────

  if (!usage && !loading) {
    return (
      <main style={{ maxWidth: 500, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>RAIS Cloud Dashboard</div>
          <h1 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em' }}>Enter your API key</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.65 }}>
            Your key starts with <code style={{ ...mono, fontSize: 12, background: 'rgba(255,255,255,0.07)', padding: '2px 6px', borderRadius: 4, color: '#93c5fd' }}>ras_live_</code> or <code style={{ ...mono, fontSize: 12, background: 'rgba(255,255,255,0.07)', padding: '2px 6px', borderRadius: 4, color: '#93c5fd' }}>ras_test_</code>
          </p>
        </div>

        <form onSubmit={handleKeySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="ras_live_..."
              value={draftKey}
              onChange={e => { setDraftKey(e.target.value); setLoadError('') }}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '13px 44px 13px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: loadError ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, color: '#f1f5f9', fontSize: 14, outline: 'none',
                ...mono,
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 13 }}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>

          {loadError && (
            <div style={{ fontSize: 13, color: '#f87171', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8 }}>
              {loadError}
            </div>
          )}

          <button
            type="submit"
            disabled={!draftKey.trim()}
            style={{ padding: '13px', background: '#3B5BFF', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: !draftKey.trim() ? 'not-allowed' : 'pointer', opacity: !draftKey.trim() ? 0.5 : 1 }}
          >
            Open dashboard →
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#334155' }}>
          Don't have a key?{' '}
          <a href="https://react-ai-stream-playground.vercel.app/cloud#waitlist" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>
            Join the waitlist →
          </a>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#475569' }}>Connecting to RAIS Cloud…</div>
      </main>
    )
  }

  // ─── Full Dashboard ───────────────────────────────────────────────────────

  const quickstartCode = `import { useAIChat } from '@react-ai-stream/react'

const { messages, sendMessage, loading } = useAIChat({
  endpoint: "${GATEWAY_DISPLAY}/api/v1/chat",
  extraHeaders: {
    Authorization: \`Bearer ${key || 'ras_live_...'}\`,
  },
})`

  const curlCode = `curl -X POST ${GATEWAY_DISPLAY}/api/v1/chat \\
  -H "Authorization: Bearer ${key || 'ras_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Hello"}],"provider":"groq"}' \\
  --no-buffer`

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em' }}>Dashboard</h1>
          <div style={{ fontSize: 12, color: '#334155', ...mono }}>
            {usage?.key_id ? `${key.slice(0, 14)}···` : ''}
            {usage?.plan && <span style={{ ...badge(planColor), marginLeft: 8 }}>{usage.plan}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => fetchUsage(key)}
            style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => { setUsage(null); setKey(''); setDraftKey(''); localStorage.removeItem('rais_dashboard_key') }}
            style={{ padding: '7px 14px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#475569', fontSize: 12, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
        {(['overview', 'quickstart', 'test'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #3B5BFF' : '2px solid transparent',
              color: tab === t ? '#f1f5f9' : '#475569',
              fontSize: 13,
              fontWeight: tab === t ? 700 : 500,
              cursor: 'pointer',
              marginBottom: -1,
              textTransform: 'capitalize',
              transition: 'color 0.12s',
            }}
          >
            {t === 'test' ? 'Live test' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
            {[
              { label: 'Plan', value: (usage?.plan ?? '-').toUpperCase(), color: planColor },
              { label: 'Total requests', value: (usage?.requests_total ?? 0).toLocaleString(), color: '#f1f5f9' },
              { label: 'Tokens used', value: (usage?.tokens_total ?? 0).toLocaleString(), color: '#f1f5f9' },
              {
                label: 'Monthly limit',
                value: usage?.monthly_limit === -1 ? 'Unlimited' : (usage?.monthly_limit ?? 0).toLocaleString(),
                color: '#22c55e',
              },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Usage bar */}
          {pct !== null && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Monthly token usage</span>
                <span style={{ color: '#475569', ...mono }}>{usage!.tokens_total.toLocaleString()} / {usage!.monthly_limit.toLocaleString()}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct > 80 ? '#f59e0b' : '#3B5BFF',
                  borderRadius: 4,
                  transition: 'width 0.6s',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>{pct.toFixed(1)}% used</div>
            </div>
          )}

          {/* Tokens by day chart */}
          {recentDays.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Tokens — last 7 days</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90 }}>
                {recentDays.map(([day, tokens]) => (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'default' }} title={`${day}: ${tokens.toLocaleString()} tokens`}>
                    <div style={{ width: '100%', background: '#3B5BFF', borderRadius: '3px 3px 0 0', height: `${(tokens / maxDayTokens) * 68}px`, minHeight: 3, transition: 'height 0.5s', opacity: 0.85 }} />
                    <div style={{ fontSize: 9, color: '#334155', textAlign: 'center', whiteSpace: 'nowrap' }}>{day.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider breakdown */}
          {totalProviderReqs > 0 && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Provider breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(usage!.providers).map(([name, count]) => {
                  const p = totalProviderReqs > 0 ? (count / totalProviderReqs) * 100 : 0
                  const color = PROVIDER_COLORS[name] ?? '#64748b'
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: '#94a3b8', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                          {name}
                        </span>
                        <span style={{ fontSize: 12, color: '#475569', ...mono }}>{count} reqs · {p.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Endpoint reference */}
          <div style={{ ...card, background: 'rgba(59,91,255,0.05)', border: '1px solid rgba(59,91,255,0.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Your endpoint</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <code style={{ flex: 1, ...mono, fontSize: 13, color: '#93c5fd', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 7, border: '1px solid rgba(59,91,255,0.15)' }}>
                {GATEWAY_DISPLAY}/api/v1/chat
              </code>
              <button onClick={() => copy(`${GATEWAY_DISPLAY}/api/v1/chat`, 'endpoint')} style={copyBtn}>
                {copied === 'endpoint' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quickstart tab ────────────────────────────────────────────────── */}
      {tab === 'quickstart' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>React / Next.js</div>
                <div style={{ fontSize: 12, color: '#475569' }}>Drop into any component. Zero backend changes.</div>
              </div>
              <button onClick={() => copy(quickstartCode, 'react')} style={copyBtn}>
                {copied === 'react' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre style={codeBlock}><code>{quickstartCode}</code></pre>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>cURL</div>
                <div style={{ fontSize: 12, color: '#475569' }}>Test directly from your terminal.</div>
              </div>
              <button onClick={() => copy(curlCode, 'curl')} style={copyBtn}>
                {copied === 'curl' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre style={codeBlock}><code>{curlCode}</code></pre>
          </div>

          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Request body reference</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { field: 'messages', type: 'Message[]', req: true, desc: 'Chat history. Each message: { role, content }' },
                { field: 'provider', type: '"groq" | "openai" | "anthropic" | "gemini"', req: false, desc: 'Default: groq (fastest)' },
                { field: 'model', type: 'string', req: false, desc: 'Override the provider default model' },
                { field: 'max_tokens', type: 'number', req: false, desc: `Capped at ${usage?.plan === 'pro' ? '8192' : usage?.plan === 'team' ? '16384' : '1024'} for your plan` },
              ].map(r => (
                <div key={r.field} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, alignItems: 'start' }}>
                  <div>
                    <code style={{ ...mono, fontSize: 12, color: '#93c5fd' }}>{r.field}</code>
                    {r.req && <span style={{ ...badge('#f59e0b'), marginLeft: 5, fontSize: 9 }}>required</span>}
                  </div>
                  <div>
                    <code style={{ ...mono, fontSize: 11, color: '#4ade80' }}>{r.type}</code>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Response format — RAIS Protocol v1</div>
            <pre style={codeBlock}><code>{`data: {"type":"text","text":"Hello"}

data: {"type":"text","text":" world"}

data: {"type":"done"}`}</code></pre>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 12, lineHeight: 1.65 }}>
              Standard SSE stream. Each frame is a JSON object with a <code style={{ ...mono, fontSize: 11, color: '#93c5fd' }}>type</code> field.
              {' '}<a href="https://react-ai-stream-docs.vercel.app/spec" target="_blank" rel="noreferrer" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>Full spec →</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Live test tab ─────────────────────────────────────────────────── */}
      {tab === 'test' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Send a live request</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Provider</label>
                <select
                  value={testProvider}
                  onChange={e => setTestProvider(e.target.value as typeof testProvider)}
                  disabled={testStatus === 'streaming'}
                  style={{ ...inputSt, width: '100%', cursor: 'pointer' }}
                >
                  <option value="groq" style={{ background: '#0f172a' }}>Groq — Llama 3.3</option>
                  <option value="openai" style={{ background: '#0f172a' }}>OpenAI — GPT-4o mini</option>
                  <option value="anthropic" style={{ background: '#0f172a' }}>Anthropic — Claude Haiku</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Prompt</label>
              <textarea
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                disabled={testStatus === 'streaming'}
                rows={2}
                style={{ ...inputSt, width: '100%', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.55 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={runTest}
                disabled={testStatus === 'streaming' || !testPrompt.trim()}
                style={{
                  padding: '10px 22px',
                  background: testStatus === 'streaming' ? 'rgba(59,91,255,0.4)' : '#3B5BFF',
                  color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: testStatus === 'streaming' ? 'not-allowed' : 'pointer',
                }}
              >
                {testStatus === 'streaming' ? '● Streaming…' : '▶ Run'}
              </button>
              {testStatus === 'streaming' && (
                <button
                  onClick={() => { abortRef.current?.abort(); setTestStatus('idle') }}
                  style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Stats bar */}
          {(testStatus !== 'idle' || testOutput) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Status', value: testStatus === 'streaming' ? '● Live' : testStatus === 'done' ? '✓ Done' : testStatus === 'error' ? '✕ Error' : '—', color: testStatus === 'streaming' ? '#4ade80' : testStatus === 'done' ? '#22c55e' : testStatus === 'error' ? '#f87171' : '#475569' },
                { label: 'TTFB', value: testLatency !== null ? `${testLatency}ms` : '—', color: '#f1f5f9' },
                { label: 'Chunks', value: testTokens.toString(), color: '#3B5BFF' },
                { label: 'Provider', value: testProvider, color: PROVIDER_COLORS[testProvider] ?? '#64748b' },
              ].map(s => (
                <div key={s.label} style={{ ...card, flex: '1 1 120px', padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color, ...mono }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Output */}
          {testOutput && (
            <div style={{ ...card, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Response</div>
                <button onClick={() => copy(testOutput, 'output')} style={copyBtn}>{copied === 'output' ? '✓ Copied' : 'Copy'}</button>
              </div>
              <div style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 9,
                fontSize: 14,
                color: testStatus === 'error' ? '#f87171' : '#e2e8f0',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                minHeight: 60,
                maxHeight: 400,
                overflowY: 'auto',
              }}>
                {testOutput}
                {testStatus === 'streaming' && <span style={{ opacity: 0.5, animation: 'blink 1s step-end infinite' }}>▍</span>}
              </div>
            </div>
          )}

          {/* Raw SSE frames viewer hint */}
          {testStatus === 'done' && (
            <div style={{ ...card, background: 'rgba(59,91,255,0.04)', border: '1px solid rgba(59,91,255,0.12)', textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Want to inspect raw SSE frames?{' '}
                <a href="https://react-ai-stream-playground.vercel.app/inspect" target="_blank" rel="noreferrer" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>
                  Open Stream Inspector →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

// ─── Shared micro-styles ─────────────────────────────────────────────────────

const copyBtn: React.CSSProperties = {
  padding: '6px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const codeBlock: React.CSSProperties = {
  margin: 0,
  padding: '16px 18px',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 9,
  fontSize: 12,
  color: '#93c5fd',
  fontFamily: 'ui-monospace, monospace',
  overflowX: 'auto',
  lineHeight: 1.65,
  whiteSpace: 'pre',
}

const inputSt: React.CSSProperties = {
  padding: '9px 13px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}
