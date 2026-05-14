import { useSyncExternalStore, useState, useCallback } from 'react'
import { devStore } from './store.js'
import type { StreamSession, LogEntry } from './store.js'

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: '#0d1117',
  bgHeader: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  blue: '#58a6ff',
  green: '#3fb950',
  red: '#f85149',
  yellow: '#d29922',
  purple: '#bc8cff',
}

const PANEL_W = 360

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncate(s: string, n = 40) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function statusColor(s: StreamSession['status']) {
  switch (s) {
    case 'streaming': return C.blue
    case 'done':      return C.green
    case 'error':     return C.red
    case 'aborted':   return C.yellow
  }
}

function statusIcon(s: StreamSession['status']) {
  switch (s) {
    case 'streaming': return '●'
    case 'done':      return '✓'
    case 'error':     return '✕'
    case 'aborted':   return '◻'
  }
}

function logColor(type: LogEntry['type']) {
  switch (type) {
    case 'send':     return C.blue
    case 'complete': return C.green
    case 'error':    return C.red
    case 'abort':    return C.yellow
  }
}

function logLabel(type: LogEntry['type']) {
  switch (type) {
    case 'send':     return 'SEND'
    case 'complete': return 'DONE'
    case 'error':    return 'ERR '
    case 'abort':    return 'STOP'
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: StreamSession }) {
  const elapsed = session.endedAt
    ? ((session.endedAt - session.startedAt) / 1000).toFixed(1) + 's'
    : ((Date.now() - session.startedAt) / 1000).toFixed(1) + 's'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px',
        borderBottom: `1px solid ${C.border}`,
        fontSize: 11,
        fontFamily: 'monospace',
      }}
    >
      <span style={{ color: statusColor(session.status), width: 10 }}>
        {statusIcon(session.status)}
      </span>
      <span style={{ color: C.muted, flex: '0 0 52px' }}>{session.chatId}</span>
      <span style={{ color: C.text, flex: 1 }}>
        {session.tokenCount} tok
        {session.status === 'streaming' && <span style={{ color: C.muted }}> · {elapsed}</span>}
        {session.status === 'done' && session.tokensPerSec && (
          <span style={{ color: C.muted }}> · {elapsed} · {session.tokensPerSec} t/s</span>
        )}
        {session.status === 'error' && (
          <span style={{ color: C.red }}> · {truncate(session.errorMessage ?? '', 28)}</span>
        )}
      </span>
    </div>
  )
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '3px 12px',
        fontSize: 11,
        fontFamily: 'monospace',
        borderBottom: `1px solid #161b22`,
      }}
    >
      <span style={{ color: C.muted, flex: '0 0 64px' }}>{fmt(entry.timestamp)}</span>
      <span style={{ color: C.muted, flex: '0 0 52px' }}>{entry.chatId}</span>
      <span style={{ color: logColor(entry.type), flex: '0 0 32px' }}>{logLabel(entry.type)}</span>
      <span style={{ color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {truncate(entry.detail, 35)}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RAISDevTools() {
  const [open, setOpen] = useState(false)

  const snapshot = useSyncExternalStore(
    devStore.subscribe,
    devStore.getSnapshot,
    devStore.getSnapshot,
  )

  const handleClear = useCallback(() => devStore.clear(), [])

  const sessions = Array.from(snapshot.sessions.values())
  const activeSessions = sessions.filter((s) => s.status === 'streaming')
  const totalTokens = sessions.reduce((sum, s) => sum + s.tokenCount, 0)
  const logReversed = [...snapshot.log].reverse()

  const badge = activeSessions.length > 0
    ? activeSessions.length
    : snapshot.log.length

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 999999,
        fontFamily: 'monospace',
        userSelect: 'none',
      }}
    >
      {/* Panel — expands above the toggle button */}
      {open && (
        <div
          style={{
            width: PANEL_W,
            maxHeight: 440,
            marginBottom: 8,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: C.bgHeader,
              borderBottom: `1px solid ${C.border}`,
              gap: 8,
            }}
          >
            <span style={{ color: C.purple, fontSize: 13, fontWeight: 700 }}>◈ RAIS DevTools</span>
            <span style={{ flex: 1, color: C.muted, fontSize: 11 }}>
              {sessions.length} streams · {totalTokens} tok
            </span>
            <button
              onClick={handleClear}
              style={{
                background: 'none', border: `1px solid ${C.border}`, color: C.muted,
                borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', color: C.muted,
                fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Active streams */}
          {sessions.length > 0 && (
            <>
              <div
                style={{
                  padding: '4px 12px 2px',
                  fontSize: 10,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: C.bgHeader,
                }}
              >
                Sessions
              </div>
              <div style={{ maxHeight: 120, overflowY: 'auto', flexShrink: 0 }}>
                {sessions.map((s) => (
                  <SessionRow key={s.chatId} session={s} />
                ))}
              </div>
            </>
          )}

          {/* Event log */}
          <div
            style={{
              padding: '4px 12px 2px',
              fontSize: 10,
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              background: C.bgHeader,
              borderTop: sessions.length > 0 ? `1px solid ${C.border}` : 'none',
              flexShrink: 0,
            }}
          >
            Log — newest first
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {logReversed.length === 0 ? (
              <div style={{ padding: '20px 12px', color: C.muted, fontSize: 12, textAlign: 'center' }}>
                No events yet. Send a message to see the stream.
              </div>
            ) : (
              logReversed.map((e) => <LogRow key={e.id} entry={e} />)
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: open ? C.bgHeader : C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          color: C.purple,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'monospace',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          transition: 'background 150ms',
        }}
      >
        <span>◈ RAIS</span>
        {badge > 0 && (
          <span
            style={{
              background: activeSessions.length > 0 ? C.blue : C.border,
              color: activeSessions.length > 0 ? '#fff' : C.muted,
              borderRadius: 10,
              padding: '1px 6px',
              fontSize: 10,
              fontWeight: 600,
              minWidth: 18,
              textAlign: 'center',
            }}
          >
            {badge}
          </span>
        )}
      </button>
    </div>
  )
}
