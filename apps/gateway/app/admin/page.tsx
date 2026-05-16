'use client'

import { useState, useCallback } from 'react'

interface KeyRecord {
  id: string
  owner_email: string
  plan: string
  key_string?: string
  monthly_limit: string
  created_at: string
  admin_created?: string
}

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b',
  pro: '#3B5BFF',
  team: '#8b5cf6',
  enterprise: '#f59e0b',
}

export default function GatewayAdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [keys, setKeys] = useState<KeyRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'keys' | 'create'>('keys')

  // create form state
  const [newEmail, setNewEmail] = useState('')
  const [newPlan, setNewPlan] = useState('pro')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ key: string; plan: string } | null>(null)
  const [createError, setCreateError] = useState('')

  const authHeader = `Bearer ${secret}`

  const loadKeys = useCallback(async (sk: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/keys', {
        headers: { Authorization: `Bearer ${sk}` },
      })
      if (res.status === 403) { setError('Invalid admin secret.'); setLoading(false); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setKeys(json.keys ?? [])
      setAuthed(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!secret.trim()) return
    loadKeys(secret.trim())
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    setCreated(null)
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ email: newEmail.trim(), plan: newPlan }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setCreateError(d.error ?? `HTTP ${res.status}`)
        return
      }
      const d = await res.json()
      setCreated(d)
      setNewEmail('')
      loadKeys(secret)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id: string) {
    if (!confirm(`Revoke key ${id.slice(0, 12)}…?`)) return
    try {
      const res = await fetch(`/api/admin/keys?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      })
      if (!res.ok) { alert('Failed to revoke'); return }
      loadKeys(secret)
    } catch {
      alert('Network error')
    }
  }

  if (!authed) {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', marginBottom: 8 }}>GATEWAY ADMIN</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.04em' }}>Key Manager</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px' }}>Enter your admin secret to manage API keys.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="password"
              placeholder="rais_admin_sk_…"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              style={inputSt}
              autoFocus
            />
            {error && <div style={errBox}>{error}</div>}
            <button type="submit" disabled={loading || !secret.trim()} style={{ ...btnSt, background: '#f59e0b', color: '#0a0f1e' }}>
              {loading ? 'Checking…' : 'Open admin panel →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...page, alignItems: 'flex-start', padding: '40px 32px' }}>
      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', marginBottom: 4 }}>GATEWAY ADMIN</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.04em' }}>
              API Keys
              <span style={{ fontSize: 14, fontWeight: 600, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '3px 10px', borderRadius: 20, marginLeft: 12, verticalAlign: 'middle' }}>
                {keys.length} active
              </span>
            </h1>
          </div>
          <button onClick={() => loadKeys(secret)} style={outlineBtn}>Refresh</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
          {(['keys', 'create'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #f59e0b' : '2px solid transparent',
              color: tab === t ? '#f1f5f9' : '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: -1,
              textTransform: 'capitalize',
            }}>
              {t === 'keys' ? 'All Keys' : 'Create Key'}
            </button>
          ))}
        </div>

        {tab === 'keys' && (
          <>
            {keys.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: '#64748b', padding: '48px 24px' }}>
                No API keys yet. Create one to test.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {['Plan', 'Key', 'Owner', 'Limit', 'Created', ''].map((h, i) => (
                        <th key={i} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k, i) => (
                      <tr key={k.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                        <td style={td}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            background: `${PLAN_COLORS[k.plan] ?? '#64748b'}22`,
                            color: PLAN_COLORS[k.plan] ?? '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>
                            {k.plan}
                          </span>
                          {k.admin_created === 'true' && (
                            <span style={{ fontSize: 10, color: '#475569', marginLeft: 6 }}>admin</span>
                          )}
                        </td>
                        <td style={{ ...td, fontFamily: 'monospace', color: '#93c5fd', fontSize: 12 }}>
                          {k.key_string ?? `…${k.id.slice(0, 12)}`}
                        </td>
                        <td style={{ ...td, color: '#94a3b8' }}>{k.owner_email}</td>
                        <td style={{ ...td, color: '#64748b' }}>
                          {k.monthly_limit === '-1' ? '∞' : Number(k.monthly_limit).toLocaleString()}
                        </td>
                        <td style={{ ...td, color: '#475569', whiteSpace: 'nowrap' }}>
                          {k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={td}>
                          <button onClick={() => revokeKey(k.id)} style={{
                            padding: '4px 10px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 5,
                            color: '#f87171',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}>
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'create' && (
          <div style={{ maxWidth: 480 }}>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 20px', letterSpacing: '-0.03em' }}>
                Create API Key
              </h2>
              <form onSubmit={createKey} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelSt}>Owner email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    style={inputSt}
                  />
                </div>
                <div>
                  <label style={labelSt}>Plan</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['free', 'pro', 'team', 'enterprise'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPlan(p)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 7,
                          border: newPlan === p
                            ? `1px solid ${PLAN_COLORS[p]}55`
                            : '1px solid rgba(255,255,255,0.1)',
                          background: newPlan === p
                            ? `${PLAN_COLORS[p]}18`
                            : 'rgba(255,255,255,0.03)',
                          color: newPlan === p ? PLAN_COLORS[p] : '#64748b',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
                    {newPlan === 'free' && 'test key · 5k tokens/month · 10 req/min'}
                    {newPlan === 'pro' && 'live key · 100k tokens/month · 60 req/min'}
                    {newPlan === 'team' && 'live key · 1M tokens/month · 300 req/min'}
                    {newPlan === 'enterprise' && 'live key · unlimited · 1000 req/min'}
                  </div>
                </div>

                {createError && <div style={errBox}>{createError}</div>}

                {created && (
                  <div style={{
                    padding: '14px 16px',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Key created — copy now, won't show again
                    </div>
                    <code style={{ fontSize: 12, color: '#86efac', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {created.key}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(created.key)}
                      style={{ ...outlineBtn, display: 'block', marginTop: 10, fontSize: 12, padding: '5px 12px' }}
                    >
                      Copy
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating || !newEmail.trim()}
                  style={{ ...btnSt, background: '#f59e0b', color: '#0a0f1e' }}
                >
                  {creating ? 'Creating…' : `Create ${newPlan} key →`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0a0f1e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: 24,
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 16,
  padding: '36px 40px',
  width: '100%',
  maxWidth: 480,
}

const inputSt: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

const btnSt: React.CSSProperties = {
  padding: '11px 22px',
  background: '#f59e0b',
  color: '#0a0f1e',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '-0.2px',
}

const outlineBtn: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7,
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const errBox: React.CSSProperties = {
  fontSize: 12,
  color: '#f87171',
  padding: '8px 12px',
  background: 'rgba(239,68,68,0.08)',
  borderRadius: 6,
  border: '1px solid rgba(239,68,68,0.2)',
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 7,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const th: React.CSSProperties = {
  padding: '11px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 11,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '12px 16px',
  color: '#cbd5e1',
}
