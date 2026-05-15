'use client'

import type { InspectedChunk, StreamFormat } from '@/hooks/useStreamInspect'

interface RuleResult {
  id: string
  label: string
  pass: boolean
  detail?: string
}

function rule(id: string, label: string, pass: boolean, detail?: string): RuleResult {
  return detail !== undefined ? { id, label, pass, detail } : { id, label, pass }
}

function checkCompliance(chunks: InspectedChunk[]): RuleResult[] {
  const results: RuleResult[] = []

  const missingType = chunks.find(c => !c.parsed || typeof (c.parsed as Record<string, unknown>).type !== 'string')
  results.push(rule('R1', 'All events have a "type" field', !missingType,
    missingType ? `Offending frame: ${missingType.raw.slice(0, 200)}` : undefined))

  const textChunks = chunks.filter(c => (c.parsed as Record<string, unknown>)?.type === 'text')
  const missingText = textChunks.find(c => typeof (c.parsed as Record<string, unknown>).text !== 'string')
  results.push(rule('R2', 'text events have a "text" field (string)', !missingText,
    missingText ? `Offending frame: ${missingText.raw.slice(0, 200)}` : undefined))

  const doneChunks = chunks.filter(c => (c.parsed as Record<string, unknown>)?.type === 'done')
  const last = chunks[chunks.length - 1]
  const lastIsNotDone = chunks.length > 0 && last?.eventType !== 'done'
  const r3Detail =
    doneChunks.length === 0 ? 'No done event found' :
    doneChunks.length > 1 ? `${doneChunks.length} done events found` :
    lastIsNotDone ? 'done event is not the last event' :
    undefined
  results.push(rule('R3', 'Exactly one "done" event, as the last event',
    doneChunks.length === 1 && !lastIsNotDone, r3Detail))

  const errorChunks = chunks.filter(c => (c.parsed as Record<string, unknown>)?.type === 'error')
  const missingError = errorChunks.find(c => typeof (c.parsed as Record<string, unknown>).error !== 'string')
  results.push(rule('R4', 'error events have an "error" field (string)', !missingError,
    missingError ? `Offending frame: ${missingError.raw.slice(0, 200)}` : undefined))

  const unknownChunks = chunks.filter(c => c.eventType === 'unknown' && c.parsed !== null)
  results.push(rule('R5', 'No unrecognized event types (only text, done, error)',
    unknownChunks.length === 0,
    unknownChunks.length > 0 ? `${unknownChunks.length} unknown event(s) found` : undefined))

  const nonJson = chunks.filter(c => c.parsed === null)
  const firstNonJson = nonJson[0]
  results.push(rule('R6', 'All data frames are valid JSON', nonJson.length === 0,
    firstNonJson ? `${nonJson.length} non-JSON frame(s): ${firstNonJson.raw}` : undefined))

  return results
}

function detectDominantFormat(chunks: InspectedChunk[]): StreamFormat {
  const counts: Record<string, number> = {}
  for (const c of chunks) counts[c.format] = (counts[c.format] ?? 0) + 1
  const best = Object.entries(counts)
    .filter(([f]) => f !== 'unknown')
    .sort((a, b) => b[1] - a[1])[0]
  return (best?.[0] as StreamFormat) ?? 'unknown'
}

const FORMAT_INFO: Record<string, { label: string; color: string; bg: string; border: string; note: string }> = {
  rais: {
    label: 'RAIS',
    color: '#3B5BFF',
    bg: 'rgba(59,91,255,0.08)',
    border: 'rgba(59,91,255,0.25)',
    note: 'This endpoint uses the RAIS streaming protocol. Compliance checks apply directly.',
  },
  openai: {
    label: 'OpenAI-compatible',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    note: 'This endpoint uses OpenAI SSE format (choices[0].delta.content). It is not RAIS-compliant by design — the data streams correctly but uses a different event schema.',
  },
  anthropic: {
    label: 'Anthropic',
    color: '#e879f9',
    bg: 'rgba(232,121,249,0.08)',
    border: 'rgba(232,121,249,0.25)',
    note: 'This endpoint uses Anthropic\'s SSE format (content_block_delta events). It is not RAIS-compliant by design — use the @react-ai-stream/core adapter to bridge it.',
  },
  unknown: {
    label: 'Unknown',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.08)',
    border: 'rgba(100,116,139,0.2)',
    note: 'Could not detect the streaming format. Ensure the endpoint returns SSE data frames.',
  },
}

export function ComplianceReport({ chunks, status }: { chunks: InspectedChunk[]; status: string }) {
  if (chunks.length === 0) {
    return (
      <div style={{ color: '#475569', fontSize: 13, padding: '24px 0' }}>
        {status === 'idle' ? 'Run a stream first to check compliance.' : 'Waiting for stream to complete…'}
      </div>
    )
  }

  const detectedFormat = detectDominantFormat(chunks)
  const formatInfo = FORMAT_INFO[detectedFormat] ?? FORMAT_INFO.unknown!
  const isNonRais = detectedFormat === 'openai' || detectedFormat === 'anthropic'

  const rules = checkCompliance(chunks)
  const passing = rules.filter(r => r.pass).length
  const allPass = passing === rules.length

  return (
    <div>
      {/* Format detected banner */}
      <div style={{
        marginBottom: 14,
        padding: '10px 14px',
        borderRadius: 8,
        background: formatInfo.bg,
        border: `1px solid ${formatInfo.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, fontWeight: 700, background: formatInfo.bg, color: formatInfo.color, border: `1px solid ${formatInfo.border}`, flexShrink: 0, marginTop: 1 }}>
          {formatInfo.label}
        </span>
        <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{formatInfo.note}</span>
      </div>

      {/* Overall result */}
      <div style={{
        marginBottom: 20,
        padding: '12px 16px',
        borderRadius: 8,
        background: isNonRais ? 'rgba(245,158,11,0.08)' : allPass ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${isNonRais ? 'rgba(245,158,11,0.3)' : allPass ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>{isNonRais ? '⚠' : allPass ? '✓' : '✗'}</span>
        <div>
          <div style={{ fontWeight: 700, color: isNonRais ? '#fcd34d' : allPass ? '#22c55e' : '#ef4444', fontSize: 14 }}>
            {isNonRais ? `Not RAIS — uses ${formatInfo.label} format` : allPass ? 'RAIS v1 Compliant' : 'Not fully compliant'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {isNonRais ? 'Stream is working correctly — wrong protocol for RAIS compliance' : `${passing}/${rules.length} checks passed`}
          </div>
        </div>
      </div>

      {/* Rules — grayed out for non-RAIS since they're expected to fail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: isNonRais ? 0.55 : 1 }}>
        {isNonRais && (
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 4, fontStyle: 'italic' }}>
            RAIS rule checks shown for reference — failures are expected for non-RAIS endpoints.
          </div>
        )}
        {rules.map(r => (
          <div
            key={r.id}
            style={{
              padding: '10px 14px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${r.pass ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: r.pass ? '#22c55e' : '#ef4444', fontWeight: 700, width: 16 }}>
                {r.pass ? '✓' : '✗'}
              </span>
              <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>[{r.id}]</span>
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>{r.label}</span>
            </div>
            {r.detail && !isNonRais && (
              <div style={{ marginTop: 6, marginLeft: 24, fontSize: 11, color: '#ef4444', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {r.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
