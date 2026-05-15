'use client'

import { useEffect, useRef } from 'react'
import type { InspectedChunk } from '@/hooks/useStreamInspect'

const TYPE_COLOR: Record<string, string> = {
  text: '#3B5BFF',
  done: '#22c55e',
  error: '#ef4444',
  unknown: '#94a3b8',
}

export function RawEventLog({ chunks }: { chunks: InspectedChunk[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks.length])

  if (chunks.length === 0) {
    return (
      <div style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', padding: '16px 0' }}>
        — waiting for events —
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'ui-monospace, "Cascadia Code", monospace', fontSize: 12, lineHeight: 1.7 }}>
      {chunks.map((chunk, i) => {
        const color = TYPE_COLOR[chunk.eventType] ?? '#94a3b8'
        return (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#334155', width: 52, textAlign: 'right', flexShrink: 0, fontSize: 11 }}>
              {chunk.ts.toFixed(0)}ms
            </span>
            <span style={{ color: '#475569', flexShrink: 0 }}>data:</span>
            <span style={{ color, wordBreak: 'break-all' }}>{chunk.raw}</span>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
