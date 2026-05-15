'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { InspectedChunk, InspectStatus } from '@/hooks/useStreamInspect'

interface Props {
  chunks: InspectedChunk[]
  status: InspectStatus
}

const SPEEDS = [0.25, 0.5, 1, 2, 5, 10]

export function StreamReplay({ chunks, status }: Props) {
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDone = status === 'done' || status === 'error' || status === 'aborted'

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  const reset = useCallback(() => {
    clearTimer()
    setCurrentIdx(-1)
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    reset()
  }, [chunks.length === 0])

  useEffect(() => {
    if (!isPlaying || chunks.length === 0) return

    const next = currentIdx + 1
    if (next >= chunks.length) {
      setIsPlaying(false)
      return
    }

    const currentChunk = chunks[currentIdx]
    const nextChunk = chunks[next]
    if (!nextChunk) return

    const delay = currentIdx < 0
      ? 0
      : Math.max(0, (nextChunk.ts - (currentChunk?.ts ?? 0)) / speed)

    timerRef.current = setTimeout(() => {
      setCurrentIdx(next)
    }, delay)

    return clearTimer
  }, [isPlaying, currentIdx, speed, chunks])

  const play = () => {
    if (currentIdx >= chunks.length - 1) setCurrentIdx(-1)
    setIsPlaying(true)
  }
  const pause = () => { setIsPlaying(false); clearTimer() }
  const stepForward = () => {
    setIsPlaying(false)
    setCurrentIdx(i => Math.min(i + 1, chunks.length - 1))
  }
  const stepBack = () => {
    setIsPlaying(false)
    setCurrentIdx(i => Math.max(i - 1, -1))
  }

  if (!isDone || chunks.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#334155', fontSize: 13 }}>
        {status === 'streaming' ? 'Replay available after the stream completes.' : 'Run a stream to enable replay.'}
      </div>
    )
  }

  const visibleChunks = currentIdx < 0 ? [] : chunks.slice(0, currentIdx + 1)
  const assembledText = visibleChunks
    .filter(c => c.eventType === 'text')
    .map(c => (c.parsed as Record<string, unknown>)?.text ?? '')
    .join('')

  const progress = chunks.length > 0 ? ((currentIdx + 1) / chunks.length) * 100 : 0
  const currentChunk = chunks[currentIdx]
  const nextChunk = chunks[currentIdx + 1]
  const timeToNext = currentChunk && nextChunk ? (nextChunk.ts - currentChunk.ts) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <CtrlBtn onClick={reset} title="Reset" disabled={currentIdx < 0}>⏮</CtrlBtn>
          <CtrlBtn onClick={stepBack} title="Step back" disabled={currentIdx < 0}>⏪</CtrlBtn>
          {isPlaying
            ? <CtrlBtn onClick={pause} title="Pause" accent>⏸</CtrlBtn>
            : <CtrlBtn onClick={play} title="Play" accent disabled={chunks.length === 0}>▶</CtrlBtn>
          }
          <CtrlBtn onClick={stepForward} title="Step forward" disabled={currentIdx >= chunks.length - 1}>⏩</CtrlBtn>
        </div>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {SPEEDS.map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: speed === s ? 'rgba(59,91,255,0.25)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${speed === s ? 'rgba(59,91,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: speed === s ? '#93c5fd' : '#475569',
            }}>{s}×</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
          {currentIdx + 1} / {chunks.length}
          {timeToNext !== null && <span style={{ marginLeft: 8 }}>+{timeToNext.toFixed(0)}ms</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6, position: 'relative', cursor: 'pointer' }}
        onClick={e => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          setCurrentIdx(Math.floor(pct * chunks.length) - 1)
          setIsPlaying(false)
        }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#3B5BFF', borderRadius: 4, transition: 'width 0.1s linear' }} />
      </div>

      {/* Assembled text output */}
      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 18px', minHeight: 120, fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {assembledText || <span style={{ color: '#334155' }}>Press ▶ or step through events to replay the stream.</span>}
        {isPlaying && <span style={{ display: 'inline-block', width: 2, height: 14, background: '#3B5BFF', marginLeft: 2, animation: 'blink 0.8s step-end infinite', verticalAlign: 'middle' }} />}
      </div>

      {/* Current chunk detail */}
      {currentChunk && (
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              background: currentChunk.eventType === 'text' ? 'rgba(59,91,255,0.2)' : currentChunk.eventType === 'done' ? 'rgba(34,197,94,0.2)' : currentChunk.eventType === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.2)',
              color: currentChunk.eventType === 'text' ? '#93c5fd' : currentChunk.eventType === 'done' ? '#4ade80' : currentChunk.eventType === 'error' ? '#fca5a5' : '#94a3b8',
            }}>{currentChunk.eventType}</span>
            <span style={{ fontSize: 11, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>t={currentChunk.ts.toFixed(0)}ms</span>
          </div>
          <pre style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {currentChunk.raw.slice(0, 200)}{currentChunk.raw.length > 200 ? '…' : ''}
          </pre>
        </div>
      )}
    </div>
  )
}

function CtrlBtn({ onClick, title, disabled, accent, children }: {
  onClick: () => void; title: string; disabled?: boolean; accent?: boolean; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      width: 34, height: 32, borderRadius: 7, border: `1px solid ${accent ? 'rgba(59,91,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
      background: accent ? 'rgba(59,91,255,0.2)' : 'rgba(255,255,255,0.04)',
      color: disabled ? '#334155' : accent ? '#93c5fd' : '#94a3b8',
      fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      {children}
    </button>
  )
}
