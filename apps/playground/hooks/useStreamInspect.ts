'use client'

import { useState, useCallback, useRef } from 'react'
import { parseSSE } from '@react-ai-stream/core'

export type StreamFormat = 'rais' | 'openai' | 'anthropic' | 'unknown'

export interface InspectedChunk {
  raw: string
  parsed: Record<string, unknown> | null
  ts: number
  eventType: 'text' | 'done' | 'error' | 'unknown'
  format: StreamFormat
  text: string | null  // extracted text regardless of format
}

export interface InspectStats {
  firstByteLatency: number | null
  elapsed: number
  tokensReceived: number
  toksPerSec: number
  detectedFormat: StreamFormat
}

export type InspectStatus = 'idle' | 'streaming' | 'done' | 'error' | 'aborted'

export interface StreamInspectResult {
  chunks: InspectedChunk[]
  status: InspectStatus
  stats: InspectStats
  error: string | null
  start: (url: string, headers?: Record<string, string>, body?: unknown) => void
  abort: () => void
  reset: () => void
}

const EMPTY_STATS: InspectStats = {
  firstByteLatency: null,
  elapsed: 0,
  tokensReceived: 0,
  toksPerSec: 0,
  detectedFormat: 'unknown',
}

function classifyChunk(parsed: Record<string, unknown>): {
  eventType: InspectedChunk['eventType']
  format: StreamFormat
  text: string | null
} {
  const type = parsed.type

  // ── RAIS format ──────────────────────────────────────────────────────────────
  if (type === 'text') {
    return { eventType: 'text', format: 'rais', text: typeof parsed.text === 'string' ? parsed.text : '' }
  }
  if (type === 'done') return { eventType: 'done', format: 'rais', text: null }
  if (type === 'error') return { eventType: 'error', format: 'rais', text: null }

  // ── Anthropic format ─────────────────────────────────────────────────────────
  if (type === 'content_block_delta') {
    const delta = parsed.delta as { type?: string; text?: string } | undefined
    if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
      return { eventType: 'text', format: 'anthropic', text: delta.text }
    }
    return { eventType: 'unknown', format: 'anthropic', text: null }
  }
  if (type === 'message_start' || type === 'message_delta' || type === 'message_stop' ||
      type === 'content_block_start' || type === 'content_block_stop' || type === 'ping') {
    const isDone = type === 'message_stop'
    return { eventType: isDone ? 'done' : 'unknown', format: 'anthropic', text: null }
  }

  // ── OpenAI / Groq format ─────────────────────────────────────────────────────
  const choices = parsed.choices as Array<{ delta?: { content?: string; role?: string }; finish_reason?: string | null }> | undefined
  if (Array.isArray(choices)) {
    const choice = choices[0]
    if (choice) {
      const content = choice.delta?.content
      const finishReason = choice.finish_reason
      if (finishReason === 'stop' || finishReason === 'length') {
        return { eventType: 'done', format: 'openai', text: null }
      }
      if (typeof content === 'string' && content.length > 0) {
        return { eventType: 'text', format: 'openai', text: content }
      }
      // empty delta (role-only chunk at start, or empty content)
      return { eventType: 'unknown', format: 'openai', text: null }
    }
  }

  return { eventType: 'unknown', format: 'unknown', text: null }
}

function dominantFormat(chunks: InspectedChunk[]): StreamFormat {
  const counts: Record<StreamFormat, number> = { rais: 0, openai: 0, anthropic: 0, unknown: 0 }
  for (const c of chunks) counts[c.format]++
  const best = (Object.entries(counts) as [StreamFormat, number][])
    .filter(([f]) => f !== 'unknown')
    .sort((a, b) => b[1] - a[1])[0]
  return best && best[1] > 0 ? best[0] : 'unknown'
}

export function useStreamInspect(): StreamInspectResult {
  const [chunks, setChunks] = useState<InspectedChunk[]>([])
  const [status, setStatus] = useState<InspectStatus>('idle')
  const [stats, setStats] = useState<InspectStats>(EMPTY_STATS)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setChunks([])
    setStatus('idle')
    setStats(EMPTY_STATS)
    setError(null)
  }, [])

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setStatus('aborted')
  }, [])

  const start = useCallback(async (
    url: string,
    headers: Record<string, string> = {},
    body: unknown = { messages: [{ role: 'user', content: 'Hello' }] },
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setChunks([])
    setStatus('streaming')
    setStats(EMPTY_STATS)
    setError(null)

    const startedAt = performance.now()
    let firstByteAt: number | null = null
    let tokenCount = 0
    const allChunks: InspectedChunk[] = []

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, headers, body }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }
      if (!res.body) throw new Error('No response body')

      for await (const raw of parseSSE(res.body)) {
        if (controller.signal.aborted) break

        const now = performance.now()
        if (firstByteAt === null) firstByteAt = now

        let parsed: Record<string, unknown> | null = null
        let classification = { eventType: 'unknown' as InspectedChunk['eventType'], format: 'unknown' as StreamFormat, text: null as string | null }

        try {
          parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object') {
            classification = classifyChunk(parsed as Record<string, unknown>)
          }
        } catch {
          // non-JSON SSE frame — still display it
        }

        if (classification.eventType === 'text') tokenCount++

        const elapsed = now - startedAt
        const firstByteLatency = firstByteAt ? firstByteAt - startedAt : null
        const toksPerSec = tokenCount > 0 && elapsed > 0 ? (tokenCount / elapsed) * 1000 : 0

        const chunk: InspectedChunk = {
          raw,
          parsed,
          ts: now - startedAt,
          eventType: classification.eventType,
          format: classification.format,
          text: classification.text,
        }
        allChunks.push(chunk)

        setChunks(prev => [...prev, chunk])
        setStats({
          firstByteLatency,
          elapsed,
          tokensReceived: tokenCount,
          toksPerSec,
          detectedFormat: dominantFormat(allChunks),
        })
      }

      if (!controller.signal.aborted) setStatus('done')
    } catch (err) {
      if (controller.signal.aborted) {
        setStatus('aborted')
      } else {
        setError(String(err))
        setStatus('error')
      }
    }
  }, [])

  return { chunks, status, stats, error, start, abort, reset }
}
