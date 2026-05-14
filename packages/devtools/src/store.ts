export type EventType = 'send' | 'complete' | 'error' | 'abort'

export interface LogEntry {
  id: string
  chatId: string
  type: EventType
  timestamp: number
  detail: string
}

export interface StreamSession {
  chatId: string
  status: 'streaming' | 'done' | 'error' | 'aborted'
  tokenCount: number
  startedAt: number
  endedAt: number | null
  tokensPerSec: number | null
  errorMessage: string | null
}

export interface DevStoreState {
  sessions: Map<string, StreamSession>
  log: LogEntry[]
}

const MAX_LOG = 200

function createDevStore() {
  let state: DevStoreState = { sessions: new Map(), log: [] }
  const listeners = new Set<() => void>()

  function notify() {
    // New state reference so useSyncExternalStore detects change
    state = { sessions: new Map(state.sessions), log: state.log }
    listeners.forEach((l) => l())
  }

  function pushLog(entry: Omit<LogEntry, 'id'>) {
    const full: LogEntry = { id: crypto.randomUUID(), ...entry }
    state = {
      ...state,
      log: [...state.log, full].slice(-MAX_LOG),
    }
  }

  return {
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    getSnapshot(): DevStoreState {
      return state
    },

    onSend(chatId: string, content: string) {
      state.sessions.set(chatId, {
        chatId,
        status: 'streaming',
        tokenCount: 0,
        startedAt: Date.now(),
        endedAt: null,
        tokensPerSec: null,
        errorMessage: null,
      })
      pushLog({ chatId, type: 'send', timestamp: Date.now(), detail: content })
      notify()
    },

    onToken(chatId: string) {
      const s = state.sessions.get(chatId)
      if (!s) return
      s.tokenCount++
      // Update in-place — sessions Map is replaced in notify()
      notify()
    },

    onComplete(chatId: string) {
      const s = state.sessions.get(chatId)
      if (!s) return
      const elapsed = (Date.now() - s.startedAt) / 1000
      s.status = 'done'
      s.endedAt = Date.now()
      s.tokensPerSec = elapsed > 0 ? Math.round(s.tokenCount / elapsed) : null
      pushLog({
        chatId,
        type: 'complete',
        timestamp: Date.now(),
        detail: `${s.tokenCount} tok · ${elapsed.toFixed(1)}s${s.tokensPerSec ? ` · ${s.tokensPerSec} tok/s` : ''}`,
      })
      notify()
    },

    onError(chatId: string, message: string) {
      const s = state.sessions.get(chatId)
      if (s) {
        s.status = 'error'
        s.endedAt = Date.now()
        s.errorMessage = message
      }
      pushLog({ chatId, type: 'error', timestamp: Date.now(), detail: message })
      notify()
    },

    onAbort(chatId: string) {
      const s = state.sessions.get(chatId)
      if (s) {
        s.status = 'aborted'
        s.endedAt = Date.now()
      }
      pushLog({ chatId, type: 'abort', timestamp: Date.now(), detail: 'stream aborted' })
      notify()
    },

    clear() {
      state = { sessions: new Map(), log: [] }
      listeners.forEach((l) => l())
    },
  }
}

export const devStore = createDevStore()
