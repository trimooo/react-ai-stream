'use client'

import { useState, useCallback } from 'react'

export interface SavedSession {
  id: string
  createdAt: number
  label: string
  url: string
  headers: string
  body: string
  elapsed: number
  ttfb: number | null
  tokensReceived: number
  toksPerSec: number
  chunkCount: number
}

const KEY = 'rais-sessions'
const MAX = 20

function load(): SavedSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedSession[]
  } catch {
    return []
  }
}

function save(sessions: SavedSession[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, MAX)))
  } catch {}
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SavedSession[]>(() => {
    if (typeof window === 'undefined') return []
    return load()
  })

  const addSession = useCallback((session: Omit<SavedSession, 'id' | 'createdAt'>) => {
    const entry: SavedSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    setSessions(prev => {
      const next = [entry, ...prev].slice(0, MAX)
      save(next)
      return next
    })
  }, [])

  const removeSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      save(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setSessions([])
    try { localStorage.removeItem(KEY) } catch {}
  }, [])

  return { sessions, addSession, removeSession, clearAll }
}
