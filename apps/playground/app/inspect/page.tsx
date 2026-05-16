'use client'

import { useState, useEffect, useCallback } from 'react'
import { EndpointForm } from '@/components/EndpointForm'
import { StreamTimeline } from '@/components/StreamTimeline'
import { RawEventLog } from '@/components/RawEventLog'
import { ComplianceReport } from '@/components/ComplianceReport'
import { CodeGenPanel } from '@/components/CodeGenPanel'
import { StreamReplay } from '@/components/StreamReplay'
import { useStreamInspect } from '@/hooks/useStreamInspect'
import { loadSessionFromUrl, buildShareUrl } from '@/hooks/useShareSession'
import { useSessionHistory } from '@/hooks/useSessionHistory'
import type { EndpointConfig } from '@/components/EndpointForm'

type Tab = 'timeline' | 'raw' | 'compliance' | 'replay' | 'code'

export default function InspectPage() {
  const { chunks, status, stats, error, start, abort, reset } = useStreamInspect()
  const { sessions, addSession, removeSession, clearAll } = useSessionHistory()
  const [activeTab, setActiveTab] = useState<Tab>('timeline')
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [lastConfig, setLastConfig] = useState<EndpointConfig | null>(null)
  const [sessionConfig, setSessionConfig] = useState<EndpointConfig | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const cfg = loadSessionFromUrl()
    if (cfg) setSessionConfig(cfg)
  }, [])

  useEffect(() => {
    if (status === 'done' && chunks.length > 0 && lastConfig && stats.tokensReceived > 0) {
      const label = (() => {
        try {
          const b = JSON.parse(lastConfig.body) as { messages?: Array<{ content?: string }> }
          const msg = b.messages?.[b.messages.length - 1]?.content ?? ''
          return msg.slice(0, 60) || lastConfig.url
        } catch { return lastConfig.url }
      })()
      addSession({
        label, url: lastConfig.url, headers: lastConfig.headers, body: lastConfig.body,
        elapsed: stats.elapsed, ttfb: stats.firstByteLatency,
        tokensReceived: stats.tokensReceived, toksPerSec: stats.toksPerSec,
        chunkCount: chunks.length,
      })
    }
  }, [status])

  const isStreaming = status === 'streaming'
  const hasData = chunks.length > 0
  const isCompliant = hasData && !chunks.some(c =>
    c.eventType === 'unknown' || c.parsed === null ||
    (c.eventType === 'error' && typeof (c.parsed as Record<string, unknown>)?.error !== 'string')
  )

  const handleConfig = useCallback((cfg: EndpointConfig) => setLastConfig(cfg), [])

  function handleSubmit(url: string, headers: Record<string, string>, body: unknown) {
    reset(); start(url, headers, body)
  }

  function shareConfig() {
    if (!lastConfig) return
    const url = buildShareUrl(lastConfig)
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('Link copied!')
      setTimeout(() => setShareMsg(null), 2500)
    })
    window.history.replaceState(null, '', url)
  }

  const parsedLastHeaders = useCallback((): Record<string, string> => {
    try { return JSON.parse(lastConfig?.headers ?? '{}') as Record<string, string> } catch { return {} }
  }, [lastConfig])

  const parsedLastBody = useCallback((): unknown => {
    try { return JSON.parse(lastConfig?.body ?? '{}') } catch { return {} }
  }, [lastConfig])

  const TAB_LIST: { id: Tab; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'raw', label: 'Raw SSE' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'replay', label: 'Replay ▶' },
    { id: 'code', label: 'Code ✦' },
  ]

  return (
    <main style={{ maxWidth: 1300, margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,91,255,0.12)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 20, padding: '3px 12px', marginBottom: 12, fontSize: 11, color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          RAIS Protocol v1
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9', lineHeight: 1.1 }}>
          Stream Inspector
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b', maxWidth: 500 }}>
          Inspect, debug, and compliance-check any SSE streaming endpoint.{' '}
          <a href="/compare" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>Compare providers →</a>
        </p>
      </div>

      {/* Gateway prompt */}
      <div style={{ marginBottom: 16, padding: '10px 18px', background: 'rgba(59,91,255,0.06)', border: '1px solid rgba(59,91,255,0.18)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Testing the RAIS Cloud gateway? You need a free API key.
        </div>
        <a href="/cloud#waitlist" style={{ fontSize: 12, color: '#3B5BFF', textDecoration: 'none', fontWeight: 700, padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(59,91,255,0.3)', background: 'rgba(59,91,255,0.1)', whiteSpace: 'nowrap' }}>
          Get free key →
        </a>
      </div>

      {sessionConfig && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(59,91,255,0.1)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 8, fontSize: 13, color: '#93c5fd' }}>
          ↗ Session loaded — endpoint and config pre-filled.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={cardStyle}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Endpoint</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>Forwarded via local proxy — no CORS</p>
              </div>
              {sessions.length > 0 && (
                <button onClick={() => setShowHistory(v => !v)} style={{ padding: '4px 10px', fontSize: 11, background: showHistory ? 'rgba(59,91,255,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showHistory ? 'rgba(59,91,255,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, color: showHistory ? '#93c5fd' : '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                  History ({sessions.length})
                </button>
              )}
            </div>
            <EndpointForm onSubmit={handleSubmit} onConfigChange={handleConfig} disabled={isStreaming}
              defaultUrl={sessionConfig?.url} defaultHeaders={sessionConfig?.headers} defaultBody={sessionConfig?.body} />
            {isStreaming && (
              <button onClick={abort} style={{ marginTop: 12, padding: '8px 20px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                Abort ✕
              </button>
            )}
            {hasData && !isStreaming && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={shareConfig} style={{ flex: 1, padding: '8px 0', background: 'rgba(59,91,255,0.15)', border: '1px solid rgba(59,91,255,0.3)', color: '#93c5fd', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {shareMsg ?? '↗ Share config'}
                </button>
                <button onClick={reset} style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                  Reset
                </button>
              </div>
            )}
          </div>

          {showHistory && sessions.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>Recent Sessions</div>
                <button onClick={clearAll} style={{ fontSize: 11, color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                {sessions.map(s => (
                  <div key={s.id} style={{ padding: '9px 11px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 8 }}
                    onClick={() => { setSessionConfig({ url: s.url, headers: s.headers, body: s.body }); setShowHistory(false) }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{s.tokensReceived} tok · {s.elapsed.toFixed(0)}ms · {new Date(s.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeSession(s.id) }} style={{ fontSize: 12, color: '#334155', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {hasData && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Status', value: status.toUpperCase(), color: status === 'done' ? '#22c55e' : status === 'error' ? '#ef4444' : '#3B5BFF' },
                { label: 'Events', value: String(chunks.length) },
                { label: 'Tokens', value: String(stats.tokensReceived) },
                { label: 'Elapsed', value: `${stats.elapsed.toFixed(0)}ms` },
                { label: 'TTFB', value: stats.firstByteLatency ? `${stats.firstByteLatency.toFixed(0)}ms` : '—' },
                { label: 'Tok/s', value: stats.toksPerSec > 0 ? stats.toksPerSec.toFixed(1) : '—' },
                (() => {
                  const fmt = stats.detectedFormat
                  if (fmt === 'rais') return { label: 'Format', value: 'RAIS ✓', color: '#3B5BFF' }
                  if (fmt === 'openai') return { label: 'Format', value: 'OpenAI', color: '#10b981' }
                  if (fmt === 'anthropic') return { label: 'Format', value: 'Anthropic', color: '#e879f9' }
                  return { label: 'Format', value: '?', color: '#475569' }
                })(),
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 14px', minWidth: 72 }}>
                  <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color ?? '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

          <div style={{ ...cardStyle, minHeight: 300 }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 12, flexWrap: 'wrap' }}>
              {TAB_LIST.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === t.id ? 'rgba(59,91,255,0.2)' : 'transparent', color: activeTab === t.id ? '#93c5fd' : '#64748b' }}>
                  {t.label}
                </button>
              ))}
            </div>
            {activeTab === 'timeline' && <StreamTimeline chunks={chunks} />}
            {activeTab === 'raw' && <div style={{ maxHeight: 480, overflowY: 'auto' }}><RawEventLog chunks={chunks} /></div>}
            {activeTab === 'compliance' && <ComplianceReport chunks={chunks} status={status} />}
            {activeTab === 'replay' && <StreamReplay chunks={chunks} status={status} />}
            {activeTab === 'code' && <CodeGenPanel url={lastConfig?.url ?? ''} headers={parsedLastHeaders()} body={parsedLastBody()} isCompliant={isCompliant} />}
          </div>
        </div>
      </div>
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 22,
}
