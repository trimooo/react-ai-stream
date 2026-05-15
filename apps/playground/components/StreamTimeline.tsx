'use client'

import type { InspectedChunk } from '@/hooks/useStreamInspect'

const TYPE_COLOR: Record<string, string> = {
  text: '#3B5BFF',
  done: '#22c55e',
  error: '#ef4444',
  unknown: '#334155',
}

const TYPE_LABEL: Record<string, string> = {
  text: 'text',
  done: 'done',
  error: 'err',
  unknown: '—',
}

const FORMAT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  rais:      { label: 'RAIS', color: '#3B5BFF', bg: 'rgba(59,91,255,0.12)' },
  openai:    { label: 'OpenAI', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  anthropic: { label: 'Anthropic', color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
  unknown:   { label: '?', color: '#475569', bg: 'rgba(71,85,105,0.12)' },
}

export function StreamTimeline({ chunks }: { chunks: InspectedChunk[] }) {
  if (chunks.length === 0) {
    return (
      <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
        No chunks yet — start a stream to see the timeline
      </div>
    )
  }

  const lastChunk = chunks[chunks.length - 1]
  const maxTs = lastChunk ? lastChunk.ts : 1
  const maxGap = chunks.reduce((max, c, i) => {
    const prev = chunks[i - 1]
    if (i === 0 || !prev) return 0
    return Math.max(max, c.ts - prev.ts)
  }, 0) || 1

  // detect dominant format for header badge
  const formatCounts: Record<string, number> = {}
  for (const c of chunks) formatCounts[c.format] = (formatCounts[c.format] ?? 0) + 1
  const dominantFormat = Object.entries(formatCounts)
    .filter(([f]) => f !== 'unknown')
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'
  const badge = FORMAT_BADGE[dominantFormat] ?? FORMAT_BADGE.unknown!

  const textChunks = chunks.filter(c => c.eventType === 'text' && c.text)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Format header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: badge.bg, color: badge.color }}>
          {badge.label} format
        </span>
        {textChunks.length > 0 && (
          <span style={{ fontSize: 11, color: '#334155' }}>{textChunks.length} text events</span>
        )}
      </div>

      {chunks.map((chunk, i) => {
        const prevChunk = chunks[i - 1]
        const gap = i === 0 || !prevChunk ? 0 : chunk.ts - prevChunk.ts
        const barWidth = Math.max(4, Math.round((gap / maxGap) * 120))
        const color = TYPE_COLOR[chunk.eventType] ?? '#334155'
        const label = TYPE_LABEL[chunk.eventType] ?? '—'

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ color: '#475569', width: 52, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {chunk.ts.toFixed(0)}ms
            </span>
            <div
              style={{
                width: barWidth,
                height: 16,
                borderRadius: 3,
                background: color,
                opacity: 0.85,
                flexShrink: 0,
                transition: 'width 0.1s',
              }}
              title={`+${gap.toFixed(0)}ms since previous`}
            />
            <span style={{ color, fontWeight: 600, width: 32, flexShrink: 0 }}>{label}</span>
            {chunk.text && (
              <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                {chunk.text}
              </span>
            )}
            {!chunk.text && chunk.eventType === 'unknown' && chunk.format !== 'unknown' && (
              <span style={{ color: '#1e293b', fontSize: 11, fontStyle: 'italic' }}>meta</span>
            )}
            <span style={{ color: '#1e293b', fontSize: 11, marginLeft: 'auto', flexShrink: 0 }}>
              +{gap.toFixed(0)}ms
            </span>
          </div>
        )
      })}
      <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>
        {chunks.length} events · {maxTs.toFixed(0)}ms total
      </div>
    </div>
  )
}
