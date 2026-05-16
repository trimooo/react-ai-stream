'use client'

import { useState, useCallback } from 'react'

interface WaitlistEntry {
  email: string
  name?: string
  use_case?: string
  joined_at?: string
}

interface WaitlistData {
  total: number
  entries: WaitlistEntry[]
}

const PLAN_COLORS: Record<string, string> = {
  free: '#4ade80', pro: '#3B5BFF', team: '#e879f9', enterprise: '#f59e0b',
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [data, setData] = useState<WaitlistData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Grant access modal state
  const [grantEmail, setGrantEmail] = useState<string | null>(null)
  const [grantPlan, setGrantPlan] = useState('pro')
  const [granting, setGranting] = useState(false)
  const [grantResult, setGrantResult] = useState<{
    key: string
    plan: string
    email_sent: boolean
    email_redirected_to: string | null
    email_error: string | null
  } | null>(null)
  const [grantError, setGrantError] = useState('')

  const load = useCallback(async (sk: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/waitlist', {
        headers: { Authorization: `Bearer ${sk}` },
      })
      if (res.status === 403) { setError('Invalid admin secret.'); setLoading(false); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
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
    load(secret.trim())
  }

  function exportCsv() {
    if (!data) return
    const rows = [
      ['#', 'Name', 'Email', 'Use Case', 'Joined At'],
      ...data.entries.map((e, i) => [
        String(i + 1),
        e.name ?? '',
        e.email,
        e.use_case ?? '',
        e.joined_at ? new Date(e.joined_at).toLocaleString() : '',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function grantAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!grantEmail) return
    setGranting(true)
    setGrantError('')
    setGrantResult(null)
    try {
      const res = await fetch('/api/admin/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ email: grantEmail, plan: grantPlan }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setGrantError(d.error ?? `HTTP ${res.status}`)
        return
      }
      const d = await res.json()
      setGrantResult(d)
    } catch (e) {
      setGrantError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setGranting(false)
    }
  }

  function closeGrant() {
    setGrantEmail(null)
    setGrantResult(null)
    setGrantError('')
    setGrantPlan('pro')
  }

  if (!authed) {
    return (
      <div style={page}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3B5BFF', letterSpacing: '0.1em', marginBottom: 8 }}>ADMIN</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.04em' }}>Waitlist</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px' }}>Enter your admin secret to view signups.</p>
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
            <button type="submit" disabled={loading || !secret.trim()} style={btnSt}>
              {loading ? 'Checking…' : 'View waitlist →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...page, alignItems: 'flex-start', padding: '40px 32px' }}>
      {/* Grant Access Modal */}
      {grantEmail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '32px 36px', width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
              Grant Access
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px' }}>
              Creates a key and sends the welcome email with use-case quickstart.
            </p>

            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Granting to</div>
              <div style={{ fontSize: 14, color: '#93c5fd', fontFamily: 'monospace' }}>{grantEmail}</div>
            </div>

            <form onSubmit={grantAccess} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelSt}>Plan</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['free', 'pro', 'team', 'enterprise'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGrantPlan(p)}
                      style={{
                        padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: grantPlan === p ? `1px solid ${PLAN_COLORS[p]}55` : '1px solid rgba(255,255,255,0.1)',
                        background: grantPlan === p ? `${PLAN_COLORS[p]}18` : 'rgba(255,255,255,0.03)',
                        color: grantPlan === p ? PLAN_COLORS[p] : '#64748b',
                        textTransform: 'capitalize',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
                  {grantPlan === 'free' && 'ras_test_ · 5k tokens/mo · 10 req/min'}
                  {grantPlan === 'pro' && 'ras_live_ · 100k tokens/mo · 60 req/min'}
                  {grantPlan === 'team' && 'ras_live_ · 1M tokens/mo · 300 req/min'}
                  {grantPlan === 'enterprise' && 'ras_live_ · unlimited · 1,000 req/min'}
                </div>
              </div>

              {grantError && <div style={errBox}>{grantError}</div>}

              {grantResult && (
                <div>
                  {/* Key — always shown prominently */}
                  <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Key generated · {grantResult.plan} plan
                    </div>
                    <code style={{ display: 'block', fontSize: 12, color: '#86efac', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
                      {grantResult.key}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(grantResult?.key ?? '')}
                      style={{ ...outlineBtn, fontSize: 11, padding: '5px 12px' }}
                    >
                      Copy key
                    </button>
                  </div>

                  {/* Email status */}
                  {grantResult.email_sent && !grantResult.email_redirected_to && (
                    <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 7, fontSize: 12, color: '#4ade80' }}>
                      Email sent to <strong>{grantEmail}</strong>
                    </div>
                  )}

                  {grantResult.email_sent && grantResult.email_redirected_to && (
                    <div style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 7, fontSize: 12, color: '#fbbf24', lineHeight: 1.6 }}>
                      <strong>Dev mode:</strong> Email was redirected to <strong>{grantResult.email_redirected_to}</strong> (RESEND_TEST_TO).<br />
                      The user at <strong>{grantEmail}</strong> did NOT receive it — share the key above manually, or verify your domain at resend.com/domains.
                    </div>
                  )}

                  {!grantResult.email_sent && (
                    <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
                      <strong>Email failed</strong> ({grantResult.email_error ?? 'unknown error'}).<br />
                      Share the key above with <strong>{grantEmail}</strong> manually.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                {!grantResult && (
                  <button type="submit" disabled={granting} style={{ ...btnSt, flex: 1 }}>
                    {granting ? 'Sending…' : `Grant ${grantPlan} access + send email →`}
                  </button>
                )}
                <button type="button" onClick={closeGrant} style={{ ...outlineBtn, flex: grantResult ? 1 : undefined }}>
                  {grantResult ? 'Done' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3B5BFF', letterSpacing: '0.1em', marginBottom: 4 }}>ADMIN</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.04em' }}>
              Waitlist
              <span style={{ fontSize: 14, fontWeight: 600, background: 'rgba(59,91,255,0.15)', color: '#3B5BFF', padding: '3px 10px', borderRadius: 20, marginLeft: 12, verticalAlign: 'middle' }}>
                {data?.total ?? 0} signups
              </span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => load(secret)} style={outlineBtn}>Refresh</button>
            <button onClick={exportCsv} disabled={!data?.entries.length} style={btnSt}>Export CSV</button>
          </div>
        </div>

        {!data?.entries.length ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
            No signups yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['#', 'Name', 'Email', 'Use Case', 'Joined', 'Action'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{e.name ?? <span style={{ color: '#475569' }}>—</span>}</td>
                    <td style={{ ...td, color: '#93c5fd', fontFamily: 'monospace' }}>{e.email}</td>
                    <td style={td}>
                      {e.use_case && e.use_case !== 'Select your use case'
                        ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(59,91,255,0.1)', color: '#93c5fd' }}>{e.use_case}</span>
                        : <span style={{ color: '#475569' }}>—</span>
                      }
                    </td>
                    <td style={{ ...td, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {e.joined_at ? new Date(e.joined_at).toLocaleString() : '—'}
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => { setGrantEmail(e.email); setGrantResult(null); setGrantError('') }}
                        style={{ padding: '5px 12px', background: 'rgba(59,91,255,0.12)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 6, color: '#93c5fd', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Grant access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  maxWidth: 420,
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
  fontFamily: 'monospace',
}

const btnSt: React.CSSProperties = {
  padding: '10px 20px',
  background: '#3B5BFF',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '-0.2px',
}

const outlineBtn: React.CSSProperties = {
  ...btnSt,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#94a3b8',
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
