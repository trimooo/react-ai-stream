'use client'

import { useState } from 'react'
import { EndpointForm } from '@/components/EndpointForm'
import { StreamTimeline } from '@/components/StreamTimeline'
import { ComplianceReport } from '@/components/ComplianceReport'
import { useStreamInspect } from '@/hooks/useStreamInspect'
import type { EndpointConfig } from '@/components/EndpointForm'
import { PRESETS } from '@/components/EndpointForm'

const PRESET_A = PRESETS[0]! // Local RAIS
const PRESET_B = PRESETS[1]! // Groq

interface InspectorPanelProps {
  label: string
  accent: string
  defaultUrl?: string
  defaultHeaders?: string
  defaultBody?: string
  onConfigChange: (cfg: EndpointConfig) => void
}

function InspectorPanel({ label, accent, defaultUrl, defaultHeaders, defaultBody, onConfigChange }: InspectorPanelProps) {
  const { chunks, status, stats, error, start, abort, reset } = useStreamInspect()
  const [activeTab, setActiveTab] = useState<'timeline' | 'compliance'>('timeline')
  const isStreaming = status === 'streaming'
  const hasData = chunks.length > 0

  function handleSubmit(url: string, headers: Record<string, string>, body: unknown) {
    reset()
    start(url, headers, body)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{label}</span>
        {status === 'done' && <span style={{ fontSize: 11, color: '#22c55e', marginLeft: 'auto' }}>Done</span>}
        {status === 'streaming' && <span style={{ fontSize: 11, color: accent, marginLeft: 'auto' }}>Streaming…</span>}
        {status === 'error' && <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 'auto' }}>Error</span>}
      </div>

      <div style={cardStyle}>
        <EndpointForm
          onSubmit={handleSubmit}
          onConfigChange={onConfigChange}
          disabled={isStreaming}
          defaultUrl={defaultUrl}
          defaultHeaders={defaultHeaders}
          defaultBody={defaultBody}
          compact
        />
        {isStreaming && (
          <button onClick={abort} style={{ marginTop: 10, width: '100%', padding: '7px 0', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Abort ✕
          </button>
        )}
      </div>

      {hasData && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Events', value: String(chunks.length) },
            { label: 'Tokens', value: String(stats.tokensReceived) },
            { label: 'Elapsed', value: `${stats.elapsed.toFixed(0)}ms` },
            { label: 'TTFB', value: stats.firstByteLatency ? `${stats.firstByteLatency.toFixed(0)}ms` : '—' },
            { label: 'Tok/s', value: stats.toksPerSec > 0 ? stats.toksPerSec.toFixed(1) : '—' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 60, background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}22`, borderRadius: 7, padding: '7px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 10 }}>
          {(['timeline', 'compliance'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: '4px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeTab === t ? `${accent}22` : 'transparent', color: activeTab === t ? accent : '#64748b' }}>
              {t === 'timeline' ? 'Timeline' : 'Compliance'}
            </button>
          ))}
        </div>
        {activeTab === 'timeline' ? <StreamTimeline chunks={chunks} /> : <ComplianceReport chunks={chunks} status={status} />}
      </div>

      {/* Expose state upward */}
    </div>
  )
}

function DeltaBar({ label, a, b, unit = '', higherIsBetter = true }: {
  label: string; a: number | null; b: number | null; unit?: string; higherIsBetter?: boolean
}) {
  if (a === null && b === null) return null
  const aVal = a ?? 0
  const bVal = b ?? 0
  const diff = bVal - aVal
  const pct = aVal === 0 ? null : ((diff / aVal) * 100)
  const aWins = higherIsBetter ? aVal >= bVal : aVal <= bVal
  const color = diff === 0 ? '#64748b' : aWins ? '#22c55e' : '#ef4444'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ textAlign: 'right', fontSize: 13, color: aWins ? '#22c55e' : '#94a3b8', fontWeight: aWins ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
        {a !== null ? `${a.toFixed(a < 10 ? 1 : 0)}${unit}` : '—'}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
        {pct !== null && (
          <div style={{ fontSize: 11, color, fontWeight: 700 }}>
            {diff > 0 ? '+' : ''}{pct.toFixed(0)}%
          </div>
        )}
      </div>
      <div style={{ textAlign: 'left', fontSize: 13, color: !aWins ? '#22c55e' : '#94a3b8', fontWeight: !aWins ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
        {b !== null ? `${b.toFixed(b < 10 ? 1 : 0)}${unit}` : '—'}
      </div>
    </div>
  )
}

export default function ComparePage() {
  const inspectorA = useStreamInspect()
  const inspectorB = useStreamInspect()
  const [configA, setConfigA] = useState<EndpointConfig>({ url: PRESET_A.url, headers: PRESET_A.headers, body: PRESET_A.body })
  const [configB, setConfigB] = useState<EndpointConfig>({ url: PRESET_B.url, headers: PRESET_B.headers, body: PRESET_B.body })
  const [bothRunning, setBothRunning] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  const aIsStreaming = inspectorA.status === 'streaming'
  const bIsStreaming = inspectorB.status === 'streaming'

  function parse(s: string): unknown { try { return JSON.parse(s) } catch { return {} } }
  function parseHeaders(s: string): Record<string, string> { try { return JSON.parse(s) as Record<string, string> } catch { return {} } }

  function runBoth() {
    setBothRunning(true)
    inspectorA.reset()
    inspectorB.reset()
    inspectorA.start(configA.url, parseHeaders(configA.headers), parse(configA.body))
    inspectorB.start(configB.url, parseHeaders(configB.headers), parse(configB.body))
    setTimeout(() => setBothRunning(false), 500)
  }

  const aCompliant = inspectorA.chunks.length > 0 &&
    !inspectorA.chunks.some(c => c.eventType === 'unknown' || c.parsed === null)
  const bCompliant = inspectorB.chunks.length > 0 &&
    !inspectorB.chunks.some(c => c.eventType === 'unknown' || c.parsed === null)

  const aFormat = inspectorA.stats.detectedFormat
  const bFormat = inspectorB.stats.detectedFormat

  function formatLabel(fmt: string, compliant: boolean, hasD: boolean): string {
    if (!hasD) return '—'
    if (compliant) return '✓ RAIS Compliant'
    if (fmt === 'openai') return '⚠ OpenAI format'
    if (fmt === 'anthropic') return '⚠ Anthropic format'
    return '✗ Not compliant'
  }
  function formatColor(fmt: string, compliant: boolean, hasD: boolean): string {
    if (!hasD) return '#475569'
    if (compliant) return '#22c55e'
    if (fmt === 'openai') return '#fcd34d'
    if (fmt === 'anthropic') return '#e879f9'
    return '#ef4444'
  }

  const hasAnyData = inspectorA.chunks.length > 0 || inspectorB.chunks.length > 0
  const bothDone = inspectorA.status === 'done' && inspectorB.status === 'done'

  function shareComparison() {
    const params = new URLSearchParams({
      urlA: configA.url, urlB: configB.url,
      headersA: configA.headers, headersB: configB.headers,
      bodyA: configA.body, bodyB: configB.body,
    })
    const url = `${window.location.origin}/compare?${params.toString()}`
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('Link copied!')
      setTimeout(() => setShareMsg(null), 2500)
    })
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
            Protocol Diff
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Run two endpoints simultaneously — compare latency, throughput, and RAIS compliance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={runBoth}
            disabled={aIsStreaming || bIsStreaming || bothRunning}
            style={{
              padding: '10px 28px', background: (aIsStreaming || bIsStreaming) ? 'rgba(59,91,255,0.4)' : '#3B5BFF',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: (aIsStreaming || bIsStreaming) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {aIsStreaming || bIsStreaming ? 'Streaming…' : '⚡ Run Both'}
          </button>
          {bothDone && (
            <button onClick={shareComparison}
              style={{ padding: '10px 18px', background: 'rgba(59,91,255,0.15)', border: '1px solid rgba(59,91,255,0.3)', color: '#93c5fd', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {shareMsg ?? '↗ Share comparison'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Panel A */}
        <div>
          <InspectorPanel
            label="Endpoint A"
            accent="#3B5BFF"
            defaultUrl={PRESET_A.url}
            defaultHeaders={PRESET_A.headers}
            defaultBody={PRESET_A.body}
            onConfigChange={setConfigA}
          />
        </div>

        {/* Panel B */}
        <div>
          <InspectorPanel
            label="Endpoint B"
            accent="#e879f9"
            defaultUrl={PRESET_B.url}
            defaultHeaders={PRESET_B.headers}
            defaultBody={PRESET_B.body}
            onConfigChange={setConfigB}
          />
        </div>
      </div>

      {/* Delta table */}
      {hasAnyData && (
        <div style={{ marginTop: 40, ...cardStyle }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>Comparison</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(59,91,255,0.15)', color: '#93c5fd', fontWeight: 600 }}>A</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(232,121,249,0.15)', color: '#e879f9', fontWeight: 600 }}>B</span>
            </div>
          </div>
          <DeltaBar label="TTFB" a={inspectorA.stats.firstByteLatency} b={inspectorB.stats.firstByteLatency} unit="ms" higherIsBetter={false} />
          <DeltaBar label="Elapsed" a={inspectorA.stats.elapsed} b={inspectorB.stats.elapsed} unit="ms" higherIsBetter={false} />
          <DeltaBar label="Tok/s" a={inspectorA.stats.toksPerSec} b={inspectorB.stats.toksPerSec} higherIsBetter />
          <DeltaBar label="Tokens" a={inspectorA.stats.tokensReceived} b={inspectorB.stats.tokensReceived} higherIsBetter />
          <DeltaBar label="Events" a={inspectorA.chunks.length} b={inspectorB.chunks.length} higherIsBetter />

          {/* Cost estimate row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
              {inspectorA.stats.tokensReceived > 0 ? `~$${((inspectorA.stats.tokensReceived / 1000) * 0.002).toFixed(4)}` : '—'}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. cost</div>
            <div style={{ textAlign: 'left', fontSize: 11, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
              {inspectorB.stats.tokensReceived > 0 ? `~$${((inspectorB.stats.tokensReceived / 1000) * 0.002).toFixed(4)}` : '—'}
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'A — Protocol', compliant: aCompliant, fmt: aFormat, hasData: inspectorA.chunks.length > 0 },
              { label: 'B — Protocol', compliant: bCompliant, fmt: bFormat, hasData: inspectorB.chunks.length > 0 },
            ].map(({ label, compliant, fmt, hasData: hd }) => (
              <div key={label} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${!hd ? 'rgba(255,255,255,0.06)' : compliant ? 'rgba(34,197,94,0.2)' : fmt === 'openai' ? 'rgba(252,211,77,0.2)' : fmt === 'anthropic' ? 'rgba(232,121,249,0.2)' : 'rgba(239,68,68,0.25)'}` }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: formatColor(fmt, compliant, hd) }}>
                  {formatLabel(fmt, compliant, hd)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 20,
}
