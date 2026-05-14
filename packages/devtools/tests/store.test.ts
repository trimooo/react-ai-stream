import { describe, it, expect, beforeEach, vi } from 'vitest'
import { devStore } from '../src/store.js'

beforeEach(() => {
  devStore.clear()
})

describe('devStore — subscribe / getSnapshot', () => {
  it('getSnapshot returns initial empty state', () => {
    const snap = devStore.getSnapshot()
    expect(snap.sessions.size).toBe(0)
    expect(snap.log).toHaveLength(0)
  })

  it('subscribe fires listener on any state change', () => {
    const listener = vi.fn()
    const unsub = devStore.subscribe(listener)
    devStore.onSend('c1', 'Hello')
    expect(listener).toHaveBeenCalled()
    unsub()
  })

  it('unsubscribed listener is not called', () => {
    const listener = vi.fn()
    const unsub = devStore.subscribe(listener)
    unsub()
    devStore.onSend('c1', 'Hello')
    expect(listener).not.toHaveBeenCalled()
  })

  it('returns a new state reference on each change (useSyncExternalStore safe)', () => {
    const before = devStore.getSnapshot()
    devStore.onSend('c1', 'hello')
    const after = devStore.getSnapshot()
    expect(after).not.toBe(before)
  })
})

describe('devStore — onSend', () => {
  it('creates a streaming session with correct fields', () => {
    devStore.onSend('chat-1', 'Hello')
    const snap = devStore.getSnapshot()
    const session = snap.sessions.get('chat-1')!
    expect(session.status).toBe('streaming')
    expect(session.tokenCount).toBe(0)
    expect(session.startedAt).toBeGreaterThan(0)
    expect(session.endedAt).toBeNull()
    expect(session.errorMessage).toBeNull()
  })

  it('adds a send log entry', () => {
    devStore.onSend('chat-1', 'My message')
    const { log } = devStore.getSnapshot()
    expect(log).toHaveLength(1)
    expect(log[0]!.type).toBe('send')
    expect(log[0]!.detail).toBe('My message')
    expect(log[0]!.chatId).toBe('chat-1')
  })
})

describe('devStore — onToken', () => {
  it('increments tokenCount on the active session', () => {
    devStore.onSend('chat-1', 'Hi')
    devStore.onToken('chat-1')
    devStore.onToken('chat-1')
    devStore.onToken('chat-1')
    const session = devStore.getSnapshot().sessions.get('chat-1')!
    expect(session.tokenCount).toBe(3)
  })

  it('is a no-op for unknown chatId', () => {
    expect(() => devStore.onToken('unknown')).not.toThrow()
  })
})

describe('devStore — onComplete', () => {
  it('marks session as done with endedAt and tokensPerSec', () => {
    devStore.onSend('chat-1', 'Hi')
    devStore.onToken('chat-1')
    devStore.onToken('chat-1')
    devStore.onComplete('chat-1')
    const session = devStore.getSnapshot().sessions.get('chat-1')!
    expect(session.status).toBe('done')
    expect(session.endedAt).not.toBeNull()
  })

  it('adds a complete log entry', () => {
    devStore.onSend('chat-1', 'Hi')
    devStore.onToken('chat-1')
    devStore.onComplete('chat-1')
    const log = devStore.getSnapshot().log
    const completeEntry = log.find((e) => e.type === 'complete')
    expect(completeEntry).toBeDefined()
    expect(completeEntry!.chatId).toBe('chat-1')
  })
})

describe('devStore — onError', () => {
  it('marks session as error with errorMessage', () => {
    devStore.onSend('chat-2', 'Hi')
    devStore.onError('chat-2', 'rate limited')
    const session = devStore.getSnapshot().sessions.get('chat-2')!
    expect(session.status).toBe('error')
    expect(session.errorMessage).toBe('rate limited')
    expect(session.endedAt).not.toBeNull()
  })

  it('adds an error log entry even without an active session', () => {
    devStore.onError('ghost', 'no session')
    const log = devStore.getSnapshot().log
    expect(log.some((e) => e.type === 'error' && e.detail === 'no session')).toBe(true)
  })
})

describe('devStore — onAbort', () => {
  it('marks session as aborted', () => {
    devStore.onSend('chat-3', 'Hi')
    devStore.onAbort('chat-3')
    const session = devStore.getSnapshot().sessions.get('chat-3')!
    expect(session.status).toBe('aborted')
    expect(session.endedAt).not.toBeNull()
  })

  it('adds an abort log entry', () => {
    devStore.onSend('chat-3', 'Hi')
    devStore.onAbort('chat-3')
    const log = devStore.getSnapshot().log
    expect(log.some((e) => e.type === 'abort')).toBe(true)
  })
})

describe('devStore — clear', () => {
  it('resets sessions and log to empty', () => {
    devStore.onSend('chat-1', 'Hi')
    devStore.onToken('chat-1')
    devStore.clear()
    const snap = devStore.getSnapshot()
    expect(snap.sessions.size).toBe(0)
    expect(snap.log).toHaveLength(0)
  })

  it('notifies listeners on clear', () => {
    const listener = vi.fn()
    devStore.subscribe(listener)
    devStore.clear()
    expect(listener).toHaveBeenCalled()
  })
})

describe('devStore — log cap (MAX_LOG = 200)', () => {
  it('does not exceed 200 log entries', () => {
    for (let i = 0; i < 250; i++) {
      devStore.onSend(`c${i}`, `msg${i}`)
    }
    expect(devStore.getSnapshot().log.length).toBe(200)
  })
})

describe('devStore — multiple chat sessions', () => {
  it('tracks independent sessions by chatId', () => {
    devStore.onSend('a', 'Hello')
    devStore.onSend('b', 'World')
    devStore.onToken('a')
    devStore.onToken('a')
    devStore.onToken('b')
    const snap = devStore.getSnapshot()
    expect(snap.sessions.get('a')!.tokenCount).toBe(2)
    expect(snap.sessions.get('b')!.tokenCount).toBe(1)
  })
})
