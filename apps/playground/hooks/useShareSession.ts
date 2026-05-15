'use client'

export interface SessionConfig {
  url: string
  headers: string
  body: string
}

function encode(config: SessionConfig): string {
  return btoa(encodeURIComponent(JSON.stringify(config)))
}

function decode(s: string): SessionConfig | null {
  try {
    return JSON.parse(decodeURIComponent(atob(s))) as SessionConfig
  } catch {
    return null
  }
}

export function loadSessionFromUrl(): SessionConfig | null {
  if (typeof window === 'undefined') return null
  const p = new URLSearchParams(window.location.search)
  const s = p.get('s')
  return s ? decode(s) : null
}

export function buildShareUrl(config: SessionConfig): string {
  const encoded = encode(config)
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}?s=${encoded}`
}
