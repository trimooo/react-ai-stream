'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CadenceChart } from '@/components/CadenceChart'
import type { CadenceSample } from '@/components/CadenceChart'

// ── provider definitions ──────────────────────────────────────────────────────

interface ProviderDef {
  id: string
  name: string
  model: string
  color: string
  url: string
  costPerMTok: number
  needsKey: boolean
  keyPlaceholder: string
  buildBody: (prompt: string) => Record<string, unknown>
  buildHeaders: (key: string) => Record<string, string>
}

const DEFS: ProviderDef[] = [
  {
    id: 'groq',
    name: 'Groq',
    model: 'Llama 3.3 70B',
    color: '#f59e0b',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    costPerMTok: 0.79,
    needsKey: true,
    keyPlaceholder: 'gsk_…',
    buildBody: (p) => ({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: p }], stream: true }),
    buildHeaders: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'GPT-4o mini',
    color: '#10b981',
    url: 'https://api.openai.com/v1/chat/completions',
    costPerMTok: 2.40,
    needsKey: true,
    keyPlaceholder: 'sk-…',
    buildBody: (p) => ({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: p }], stream: true }),
    buildHeaders: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    model: 'Claude Haiku',
    color: '#e879f9',
    url: 'https://api.anthropic.com/v1/messages',
    costPerMTok: 4.00,
    needsKey: true,
    keyPlaceholder: 'sk-ant-…',
    buildBody: (p) => ({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages: [{ role: 'user', content: p }], stream: true }),
    buildHeaders: (k) => ({ 'x-api-key': k, 'anthropic-version': '2023-06-01' }),
  },
  {
    id: 'local-rais',
    name: 'Local Demo',
    model: 'Project Assistant',
    color: '#22c55e',
    url: 'http://localhost:3002/api/rais-demo',
    costPerMTok: 0,
    needsKey: false,
    keyPlaceholder: '',
    buildBody: (p) => ({ messages: [{ role: 'user', content: p }] }),
    buildHeaders: () => ({}),
  },
  {
    id: 'ollama',
    name: 'Ollama',
    model: 'Llama 3.2',
    color: '#94a3b8',
    url: 'http://localhost:11434/api/chat',
    costPerMTok: 0,
    needsKey: false,
    keyPlaceholder: '',
    buildBody: (p) => ({ model: 'llama3.2', messages: [{ role: 'user', content: p }], stream: true }),
    buildHeaders: () => ({}),
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    model: 'Nemotron 70B',
    color: '#76b900',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    costPerMTok: 3.50,
    needsKey: true,
    keyPlaceholder: 'nvapi-…',
    buildBody: (p) => ({ model: 'nvidia/llama-3.1-nemotron-70b-instruct', messages: [{ role: 'user', content: p }], stream: true, max_tokens: 1024 }),
    buildHeaders: (k) => ({ Authorization: `Bearer ${k}` }),
  },
]

// ── prompt presets ────────────────────────────────────────────────────────────

const PROMPT_PRESETS = [
  { label: 'Default', prompt: 'Explain how SSE streaming works in 3 sentences.' },
  { label: 'Coding', prompt: 'Write a Python function that recursively sorts a list of dicts by a nested key path like "user.address.zip".' },
  { label: 'Support', prompt: 'A user says: "I tried to reset my password but the email never arrives. I checked spam too." Write a friendly, helpful support reply.' },
  { label: 'Long-form', prompt: 'Write a detailed technical comparison of REST, GraphQL, tRPC, and SSE for building real-time AI applications. Include latency trade-offs, tooling maturity, and when to use each.' },
  { label: 'Speed test', prompt: 'Reply with only the word "pong".' },
  { label: 'Reasoning', prompt: 'A train leaves city A at 60 mph. Another leaves city B (300 miles away) toward A at 90 mph, starting at the same time. Where do they meet? Show each step.' },
]

// ── helpers ───────────────────────────────────────────────────────────────────

function extractText(raw: string): string {
  try {
    const d = JSON.parse(raw) as Record<string, unknown>
    if (typeof d.type === 'string') {
      if (d.type === 'text' && d.text) return String(d.text)
      const delta = (d as { delta?: { text?: string } }).delta
      if (d.type === 'content_block_delta' && delta?.text) return delta.text
    }
    const choices = (d as { choices?: Array<{ delta?: { content?: string } }> }).choices
    const content = choices?.[0]?.delta?.content
    if (typeof content === 'string') return content
  } catch {}
  return ''
}

function p50(arr: number[]): number {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = avg(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length)
}

function stabilityGrade(values: number[]): { grade: string; color: string } | null {
  if (values.length < 2) return null
  const m = avg(values)
  if (m === 0) return null
  const cv = stddev(values) / m
  if (cv < 0.1) return { grade: 'A', color: '#22c55e' }
  if (cv < 0.25) return { grade: 'B', color: '#84cc16' }
  if (cv < 0.5) return { grade: 'C', color: '#f59e0b' }
  return { grade: 'F', color: '#ef4444' }
}

interface StreamWarning {
  level: 'error' | 'warn' | 'info'
  message: string
}

function getWarnings(runs: RunResult[], avgTtfb: number, avgToks: number): StreamWarning[] {
  const warnings: StreamWarning[] = []
  const errorRate = runs.filter(r => r.error !== null).length / Math.max(runs.length, 1)
  if (errorRate > 0) warnings.push({ level: 'error', message: `${Math.round(errorRate * 100)}% of runs failed — check API key and endpoint URL` })
  if (avgToks < 1 && runs.length > 0 && errorRate === 0) warnings.push({ level: 'warn', message: 'Zero tokens counted — possible response format mismatch or streaming disabled' })
  if (avgTtfb > 2000 && avgTtfb > 0) warnings.push({ level: 'warn', message: `High TTFB (${avgTtfb.toFixed(0)}ms avg) — possible cold start, rate limiting, or slow network` })
  const tokVariance = stddev(runs.map(r => r.toksPerSec))
  const tokMean = avg(runs.map(r => r.toksPerSec))
  if (tokMean > 0 && tokVariance / tokMean > 0.5) warnings.push({ level: 'info', message: 'High throughput variance — results may not be stable enough to compare' })
  return warnings
}

// ── reproducibility hash ──────────────────────────────────────────────────────

function djb2(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h, 33) ^ str.charCodeAt(i)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function buildRunHash(prompt: string, providers: Array<{ id: string; model: string }>, numRuns: number): string {
  const key = `${prompt}|${providers.map(p => `${p.id}:${p.model}`).sort().join(',')}|runs:${numRuns}|rais-v1`
  return djb2(key)
}

// ── cadence insights ──────────────────────────────────────────────────────────

function generateInsight(samples: CadenceSample[]): string | null {
  if (samples.length < 4) return null
  const mid = (samples[0]!.ts + samples[samples.length - 1]!.ts) / 2
  const firstHalfAvg = avg(samples.filter(s => s.ts <= mid).map(s => s.toksPerSec))
  const secondHalfAvg = avg(samples.filter(s => s.ts > mid).map(s => s.toksPerSec))
  if (firstHalfAvg > secondHalfAvg * 1.4) return 'Front-loads tokens — fastest at stream start'
  if (secondHalfAvg > firstHalfAvg * 1.4) return 'Ramps up — throughput increases over stream duration'
  return 'Steady stream — consistent throughput throughout'
}

// ── report types ──────────────────────────────────────────────────────────────

interface ReportProviderRow {
  id: string
  name: string
  model: string
  color: string
  p50Ttfb: number
  avgElapsed: number
  p50ToksPerSec: number
  avgTokens: number
  errors: number
  costPerMTok: number
}

export interface ReportData {
  prompt: string
  numRuns: number
  timestamp: number
  providers: ReportProviderRow[]
  hash?: string
}

export function encodeReport(data: ReportData): string {
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

export function decodeReport(s: string): ReportData | null {
  try { return JSON.parse(decodeURIComponent(atob(s))) as ReportData } catch { return null }
}

// ── types ─────────────────────────────────────────────────────────────────────

interface RunResult {
  ttfb: number | null
  elapsed: number
  tokens: number
  toksPerSec: number
  error: string | null
  samples: CadenceSample[]
}

interface ProviderState {
  runs: RunResult[]
  status: 'idle' | 'running' | 'done' | 'error'
  currentRun: number
  liveSamples: CadenceSample[]
}

// ── chart ─────────────────────────────────────────────────────────────────────

function HBarChart({ items, unit, higherIsBetter = false }: {
  items: { label: string; color: string; value: number }[]
  unit: string
  higherIsBetter?: boolean
}) {
  const max = Math.max(...items.map(i => i.value), 1)
  const best = higherIsBetter
    ? items.reduce((a, b) => (a.value >= b.value ? a : b), items[0]!)
    : items.reduce((a, b) => (a.value <= b.value ? a : b), items[0]!)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map(item => {
        const pct = (item.value / max) * 100
        const isBest = item.label === best.label && item.value > 0
        return (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 80, fontSize: 11, color: '#64748b', textAlign: 'right', flexShrink: 0 }}>{item.label}</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 22, position: 'relative' }}>
              <div style={{
                width: `${pct}%`, height: '100%', background: item.color, borderRadius: 4, opacity: 0.85,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ width: 80, fontSize: 12, fontVariantNumeric: 'tabular-nums', color: isBest ? item.color : '#94a3b8', fontWeight: isBest ? 700 : 400 }}>
              {item.value > 0 ? `${item.value.toFixed(item.value < 10 ? 1 : 0)}${unit}` : '—'}
              {isBest && <span style={{ fontSize: 10, marginLeft: 4 }}>★</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── results table ─────────────────────────────────────────────────────────────

function ResultsTable({ defs, states, numRuns }: {
  defs: ProviderDef[]
  states: Record<string, ProviderState>
  numRuns: number
}) {
  const rows = defs.map(def => {
    const st = states[def.id]
    const runs = st?.runs ?? []
    const ttfbs = runs.filter(r => r.ttfb !== null).map(r => r.ttfb!)
    const tokRates = runs.map(r => r.toksPerSec)
    const errors = runs.filter(r => r.error !== null).length
    const avgTokens = avg(runs.map(r => r.tokens))
    const avgTtfb = avg(ttfbs)
    const costPer1K = avgTokens > 0 && def.costPerMTok > 0 ? (avgTokens / 1000) * (def.costPerMTok / 1000) : null
    const stability = stabilityGrade(tokRates)
    const warnings = runs.length >= numRuns ? getWarnings(runs, avgTtfb, avg(tokRates)) : []
    return {
      def, runs,
      status: st?.status ?? 'idle',
      currentRun: st?.currentRun ?? 0,
      p50Ttfb: p50(ttfbs),
      avgElapsed: avg(runs.map(r => r.elapsed)),
      p50ToksPerSec: p50(tokRates),
      avgTokens,
      errors,
      costPer1K,
      stability,
      warnings,
    }
  })

  const allDone = rows.every(r => r.status === 'done' || r.status === 'idle')
  const anyData = rows.some(r => r.status !== 'idle')
  const allWarnings = rows.flatMap(r => r.warnings.map(w => ({ ...w, providerName: r.def.name, color: r.def.color })))

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Provider', 'Status', 'TTFB (p50)', 'Elapsed', 'Tok/s (p50)', 'Stability', 'Est. $/1K'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.def.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.def.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{row.def.name}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{row.def.model}</div>
                  </div>
                  {row.warnings.length > 0 && (
                    <span title={row.warnings.map(w => w.message).join('\n')} style={{ fontSize: 12, cursor: 'help' }}>⚠</span>
                  )}
                </div>
              </td>
              <td style={{ padding: '10px 12px' }}>
                {row.status === 'idle' && <span style={{ color: '#334155', fontSize: 12 }}>—</span>}
                {row.status === 'running' && (
                  <span style={{ color: row.def.color, fontSize: 12 }}>Run {row.currentRun}/{numRuns}</span>
                )}
                {row.status === 'done' && row.errors === 0 && (
                  <span style={{ color: '#22c55e', fontSize: 12 }}>✓ {numRuns}/{numRuns}</span>
                )}
                {(row.status === 'error' || row.errors > 0) && (
                  <span style={{ color: '#ef4444', fontSize: 12 }}>{row.errors} error{row.errors > 1 ? 's' : ''}</span>
                )}
              </td>
              <Stat val={row.p50Ttfb} unit="ms" />
              <Stat val={row.avgElapsed} unit="ms" />
              <Stat val={row.p50ToksPerSec} unit=" t/s" />
              <td style={{ padding: '10px 12px' }}>
                {row.stability ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.stability.color, background: `${row.stability.color}18`, border: `1px solid ${row.stability.color}40`, borderRadius: 5, padding: '1px 7px' }}>
                    {row.stability.grade}
                  </span>
                ) : (
                  <span style={{ color: '#334155', fontSize: 12 }}>—</span>
                )}
              </td>
              <td style={{ padding: '10px 12px', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                {row.costPer1K !== null ? `$${row.costPer1K.toFixed(4)}` : row.def.costPerMTok === 0 ? 'Free' : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Warnings */}
      {anyData && allDone && allWarnings.length > 0 && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allWarnings.map((w, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 13px', borderRadius: 8, fontSize: 12,
              background: w.level === 'error' ? 'rgba(239,68,68,0.08)' : w.level === 'warn' ? 'rgba(245,158,11,0.08)' : 'rgba(100,116,139,0.08)',
              border: `1px solid ${w.level === 'error' ? 'rgba(239,68,68,0.2)' : w.level === 'warn' ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.15)'}`,
            }}>
              <span style={{ flexShrink: 0 }}>{w.level === 'error' ? '✕' : w.level === 'warn' ? '⚠' : 'ℹ'}</span>
              <span style={{ color: w.level === 'error' ? '#fca5a5' : w.level === 'warn' ? '#fcd34d' : '#94a3b8' }}>
                <strong style={{ color: w.color }}>{w.providerName}</strong> — {w.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {anyData && allDone && (
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={sectionStyle}>
            <div style={sectionTitle}>TTFB p50 (lower is better)</div>
            <HBarChart
              unit="ms"
              items={rows.filter(r => r.p50Ttfb > 0).map(r => ({ label: r.def.name, color: r.def.color, value: r.p50Ttfb }))}
            />
          </div>
          <div style={sectionStyle}>
            <div style={sectionTitle}>Throughput p50 (higher is better)</div>
            <HBarChart
              unit=" t/s"
              higherIsBetter
              items={rows.filter(r => r.p50ToksPerSec > 0).map(r => ({ label: r.def.name, color: r.def.color, value: r.p50ToksPerSec }))}
            />
          </div>
        </div>
      )}

      {/* Live / final cadence charts */}
      {anyData && (
        <div style={{ marginTop: 24 }}>
          <div style={{ ...sectionTitle, marginBottom: 14 }}>Token cadence — throughput over time (last run)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {rows.filter(r => r.status !== 'idle').map(row => {
              const samples = states[row.def.id]?.liveSamples ?? []
              return (
                <div key={row.def.id} style={{ ...sectionStyle, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.def.color }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{row.def.name}</span>
                    {row.status === 'running' && (
                      <span style={{ fontSize: 10, color: row.def.color, marginLeft: 'auto' }}>live</span>
                    )}
                  </div>
                  <CadenceChart samples={samples} color={row.def.color} height={64} />
                  {row.status === 'done' && samples.length >= 4 && (() => {
                    const insight = generateInsight(samples)
                    return insight ? (
                      <div style={{ marginTop: 6, fontSize: 10, color: '#475569', lineHeight: 1.4 }}>{insight}</div>
                    ) : null
                  })()}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ val, unit, decimals = 0 }: { val: number; unit: string; decimals?: number }) {
  return (
    <td style={{ padding: '10px 12px', color: val > 0 ? '#e2e8f0' : '#334155', fontVariantNumeric: 'tabular-nums' }}>
      {val > 0 ? `${val.toFixed(decimals)}${unit}` : '—'}
    </td>
  )
}

// ── report view ───────────────────────────────────────────────────────────────

function ReportView({ data }: { data: ReportData }) {
  const [copied, setCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function copyEmbed(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setEmbedCopied(true)
      setTimeout(() => setEmbedCopied(false), 2000)
    })
  }

  const best = {
    ttfb: data.providers.filter(p => p.p50Ttfb > 0).reduce(
      (a, b) => a.p50Ttfb < b.p50Ttfb ? a : b,
      data.providers.find(p => p.p50Ttfb > 0) ?? data.providers[0]!
    ),
    toks: data.providers.reduce((a, b) => (a.p50ToksPerSec >= b.p50ToksPerSec ? a : b), data.providers[0]!),
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,91,255,0.1)', border: '1px solid rgba(59,91,255,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: 11, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Shared Benchmark Report
      </div>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
            Benchmark Results
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            {data.providers.length} provider{data.providers.length > 1 ? 's' : ''} · {data.numRuns} run{data.numRuns > 1 ? 's' : ''} each · {new Date(data.timestamp).toLocaleString()}
          </p>
          {data.hash && (
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <code style={{ fontSize: 11, color: '#334155', fontFamily: 'ui-monospace, monospace', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px' }}>
                run-{data.hash}
              </code>
              <span style={{ fontSize: 11, color: '#1e293b' }}>· RAIS v1</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyLink} style={{ padding: '8px 16px', background: 'rgba(59,91,255,0.15)', border: '1px solid rgba(59,91,255,0.3)', color: '#93c5fd', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {copied ? '✓ Copied!' : '↗ Copy link'}
          </button>
          <a href="/benchmark" style={{ padding: '8px 16px', background: '#3B5BFF', color: '#fff', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Run your own →
          </a>
        </div>
      </div>

      <div style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Prompt</div>
        <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{data.prompt}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Fastest TTFB', winner: best.ttfb, value: best.ttfb.p50Ttfb > 0 ? `${best.ttfb.p50Ttfb.toFixed(0)}ms` : '—', icon: '⚡' },
          { label: 'Best Throughput', winner: best.toks, value: best.toks.p50ToksPerSec > 0 ? `${best.toks.p50ToksPerSec.toFixed(1)} t/s` : '—', icon: '🚀' },
        ].map(c => (
          <div key={c.label} style={{ padding: '16px 20px', background: `${c.winner.color}10`, border: `1px solid ${c.winner.color}30`, borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.winner.color }}>{c.winner.name}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Provider', 'TTFB (p50)', 'Elapsed', 'Tok/s (p50)', 'Tokens', 'Est. $/1K'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.providers.map(row => {
                const costPer1K = row.avgTokens > 0 && row.costPerMTok > 0 ? (row.avgTokens / 1000) * (row.costPerMTok / 1000) : null
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{row.name}</div>
                          <div style={{ fontSize: 11, color: '#475569' }}>{row.model}</div>
                        </div>
                      </div>
                    </td>
                    <Stat val={row.p50Ttfb} unit="ms" />
                    <Stat val={row.avgElapsed} unit="ms" />
                    <Stat val={row.p50ToksPerSec} unit=" t/s" />
                    <Stat val={row.avgTokens} unit="" decimals={0} />
                    <td style={{ padding: '10px 12px', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                      {costPer1K !== null ? `$${costPer1K.toFixed(4)}` : row.costPerMTok === 0 ? 'Free' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={sectionStyle}>
            <div style={sectionTitle}>TTFB p50 (lower is better)</div>
            <HBarChart unit="ms" items={data.providers.filter(r => r.p50Ttfb > 0).map(r => ({ label: r.name, color: r.color, value: r.p50Ttfb }))} />
          </div>
          <div style={sectionStyle}>
            <div style={sectionTitle}>Throughput p50 (higher is better)</div>
            <HBarChart unit=" t/s" higherIsBetter items={data.providers.filter(r => r.p50ToksPerSec > 0).map(r => ({ label: r.name, color: r.color, value: r.p50ToksPerSec }))} />
          </div>
        </div>
      </div>

      {/* Embed */}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => setShowEmbed(v => !v)} style={{ width: '100%', padding: '10px 18px', background: showEmbed ? 'rgba(59,91,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${showEmbed ? 'rgba(59,91,255,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: showEmbed ? '#93c5fd' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
          {showEmbed ? '▾' : '▸'} Embed this report
        </button>
        {showEmbed && (() => {
          const url = typeof window !== 'undefined' ? window.location.href : ''
          const providerLine = data.providers.map(p => p.name).join(' vs ')
          const markdown = `[![${providerLine} Benchmark](${url.split('?')[0]}/api/og?report=${url.split('?report=')[1] ?? ''})](${url})`
          const iframe = `<iframe src="${url}" width="800" height="500" frameborder="0" style="border-radius:12px;border:1px solid #1e293b" title="${providerLine} Benchmark"></iframe>`
          const mdLink = `[${providerLine} Benchmark — AI Stream Studio](${url})`
          return (
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0 0 8px 8px', borderTop: 'none' }}>
              {[
                { label: 'Markdown (README badge)', code: markdown },
                { label: 'Plain link', code: mdLink },
                { label: 'iframe embed', code: iframe },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <code style={{ flex: 1, fontSize: 11, color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6, fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', display: 'block', lineHeight: 1.6 }}>
                      {item.code}
                    </code>
                    <button onClick={() => copyEmbed(item.code)} style={{ flexShrink: 0, padding: '6px 12px', background: embedCopied ? 'rgba(34,197,94,0.15)' : 'rgba(59,91,255,0.15)', border: `1px solid ${embedCopied ? 'rgba(34,197,94,0.3)' : 'rgba(59,91,255,0.3)'}`, color: embedCopied ? '#4ade80' : '#93c5fd', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      {embedCopied ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(59,91,255,0.07)', border: '1px solid rgba(59,91,255,0.15)', borderRadius: 10, fontSize: 12, color: '#475569', textAlign: 'center' }}>
        Generated by{' '}
        <a href="/" style={{ color: '#3B5BFF', textDecoration: 'none', fontWeight: 600 }}>AI Stream Studio</a>
        {' '}· RAIS Protocol — No data is stored; report is encoded entirely in the URL.
      </div>
    </main>
  )
}

// ── page wrapper ──────────────────────────────────────────────────────────────

function BenchmarkPageInner() {
  const searchParams = useSearchParams()
  const reportParam = searchParams.get('report')
  const [report, setReport] = useState<ReportData | null>(null)

  useEffect(() => {
    if (reportParam) setReport(decodeReport(reportParam))
  }, [reportParam])

  if (report) return <ReportView data={report} />
  return <BenchmarkTool />
}

export default function BenchmarkClient() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading…</div>}>
      <BenchmarkPageInner />
    </Suspense>
  )
}

// ── tool ──────────────────────────────────────────────────────────────────────

function BenchmarkTool() {
  const [prompt, setPrompt] = useState('Explain how SSE streaming works in 3 sentences.')
  const [numRuns, setNumRuns] = useState(3)
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ groq: true, 'local-rais': true })
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [states, setStates] = useState<Record<string, ProviderState>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const enabledDefs = DEFS.filter(d => enabled[d.id])
  const allRunsDone = enabledDefs.length > 0 && enabledDefs.every(d => {
    const st = states[d.id]
    return st?.status === 'done' || st?.status === 'error'
  })

  function setProviderState(id: string, updater: (prev: ProviderState) => ProviderState) {
    setStates(prev => ({
      ...prev,
      [id]: updater(prev[id] ?? { runs: [], status: 'idle', currentRun: 0, liveSamples: [] }),
    }))
  }

  async function runSingle(def: ProviderDef, key: string, signal: AbortSignal): Promise<RunResult> {
    const start = performance.now()
    let ttfb: number | null = null
    let tokens = 0
    let error: string | null = null
    const samples: CadenceSample[] = []
    let lastSampleTs = 0

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: def.url, headers: def.buildHeaders(key), body: def.buildBody(prompt) }),
        signal,
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText)
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}`)
      }
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const now = performance.now()
        if (ttfb === null) ttfb = now - start
        buf += dec.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''
        let chunkToks = 0
        for (const part of parts) {
          const line = part.split('\n').find(l => l.startsWith('data: '))
          if (!line) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          if (extractText(raw)) { tokens++; chunkToks++ }
        }
        // sample every ~100ms
        if (chunkToks > 0 && now - lastSampleTs > 80) {
          const elapsed = now - start
          const toksPerSec = elapsed > 0 ? (tokens / elapsed) * 1000 : 0
          samples.push({ ts: elapsed, toksPerSec, cumTokens: tokens })
          lastSampleTs = now
          // push live samples to state so the chart updates during the run
          setProviderState(def.id, prev => ({ ...prev, liveSamples: [...samples] }))
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
      error = err instanceof Error ? err.message : String(err)
    }

    const elapsed = performance.now() - start
    return { ttfb, elapsed, tokens, toksPerSec: tokens > 0 ? (tokens / elapsed) * 1000 : 0, error, samples }
  }

  async function runProvider(def: ProviderDef, key: string, signal: AbortSignal) {
    setProviderState(def.id, () => ({ runs: [], status: 'running', currentRun: 1, liveSamples: [] }))
    try {
      for (let i = 0; i < numRuns; i++) {
        if (signal.aborted) break
        setProviderState(def.id, prev => ({ ...prev, currentRun: i + 1, liveSamples: [] }))
        const result = await runSingle(def, key, signal)
        setProviderState(def.id, prev => ({ ...prev, runs: [...prev.runs, result], liveSamples: result.samples }))
      }
      setProviderState(def.id, prev => ({ ...prev, status: 'done' }))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setProviderState(def.id, prev => ({ ...prev, status: 'error' }))
      }
    }
  }

  const runAll = useCallback(async () => {
    if (isRunning || !prompt.trim() || enabledDefs.length === 0) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStates({})
    setIsRunning(true)
    await Promise.allSettled(enabledDefs.map(d => runProvider(d, keys[d.id] ?? '', ctrl.signal)))
    setIsRunning(false)
  }, [isRunning, prompt, enabledDefs, numRuns, keys])

  function abort() {
    abortRef.current?.abort()
    setIsRunning(false)
  }

  function buildReport(): ReportData {
    const providers = enabledDefs.map(def => {
      const st = states[def.id]
      const runs = st?.runs ?? []
      const ttfbs = runs.filter(r => r.ttfb !== null).map(r => r.ttfb!)
      const toks = runs.map(r => r.toksPerSec)
      const errors = runs.filter(r => r.error !== null).length
      const avgTokens = avg(runs.map(r => r.tokens))
      return {
        id: def.id, name: def.name, model: def.model, color: def.color,
        p50Ttfb: p50(ttfbs), avgElapsed: avg(runs.map(r => r.elapsed)),
        p50ToksPerSec: p50(toks), avgTokens, errors, costPerMTok: def.costPerMTok,
      }
    })
    const hash = buildRunHash(prompt, providers, numRuns)
    return { prompt, numRuns, timestamp: Date.now(), providers, hash }
  }

  function shareReport() {
    const data = buildReport()
    const encoded = encodeReport(data)
    const url = `${window.location.origin}/benchmark?report=${encoded}`
    window.history.replaceState(null, '', `?report=${encoded}`)
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('✓ Link copied!')
      setTimeout(() => setShareMsg(null), 2500)
    })
  }

  return (
    <main style={{ maxWidth: 1300, margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
          Benchmark
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Run a prompt across providers simultaneously — compare TTFB, throughput, and cost.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, alignItems: 'start' }}>
        <div style={cardStyle}>
          <section>
            <Label>Prompt preset</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {PROMPT_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setPrompt(p.prompt)}
                  disabled={isRunning}
                  style={{
                    padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)',
                    background: prompt === p.prompt ? 'rgba(59,91,255,0.2)' : 'rgba(255,255,255,0.04)',
                    color: prompt === p.prompt ? '#93c5fd' : '#64748b',
                    fontSize: 11, fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} disabled={isRunning}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </section>

          <section style={{ marginTop: 18 }}>
            <Label>Runs per provider — {numRuns}</Label>
            <input type="range" min={1} max={10} value={numRuns} onChange={e => setNumRuns(Number(e.target.value))}
              disabled={isRunning} style={{ width: '100%', accentColor: '#3B5BFF' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 2 }}>
              <span>1</span><span>10</span>
            </div>
          </section>

          <section style={{ marginTop: 18 }}>
            <Label>Providers</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEFS.map(def => (
                <div key={def.id} style={{ borderRadius: 8, border: `1px solid ${enabled[def.id] ? def.color + '33' : 'rgba(255,255,255,0.06)'}`, padding: '10px 12px', background: enabled[def.id] ? `${def.color}08` : 'transparent', transition: 'all 0.15s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!enabled[def.id]} onChange={e => setEnabled(prev => ({ ...prev, [def.id]: e.target.checked }))}
                      disabled={isRunning} style={{ accentColor: def.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: enabled[def.id] ? '#f1f5f9' : '#64748b' }}>{def.name}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{def.model}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: def.color, opacity: enabled[def.id] ? 1 : 0.3 }} />
                  </label>
                  {def.needsKey && enabled[def.id] && (
                    <input type="password" value={keys[def.id] ?? ''} onChange={e => setKeys(prev => ({ ...prev, [def.id]: e.target.value }))}
                      placeholder={def.keyPlaceholder} disabled={isRunning}
                      style={{ ...inputStyle, marginTop: 8, fontSize: 12, fontFamily: 'ui-monospace, monospace' }} />
                  )}
                </div>
              ))}
            </div>
          </section>

          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            {isRunning ? (
              <button onClick={abort} style={{ ...btnStyle, flex: 1, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
                Abort
              </button>
            ) : (
              <button onClick={runAll} disabled={!prompt.trim() || enabledDefs.length === 0} style={{ ...btnStyle, flex: 1 }}>
                ⚡ Run Benchmark
              </button>
            )}
          </div>
          {enabledDefs.length === 0 && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8, marginBottom: 0 }}>Select at least one provider.</p>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Results</div>
            {allRunsDone && !isRunning && (
              <button onClick={shareReport} style={{ padding: '6px 14px', background: 'rgba(59,91,255,0.15)', border: '1px solid rgba(59,91,255,0.3)', color: '#93c5fd', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {shareMsg ?? '↗ Share Report'}
              </button>
            )}
          </div>
          {Object.keys(states).length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#334155', fontSize: 14 }}>
              Configure providers and click ⚡ Run Benchmark to start.
            </div>
          ) : (
            <ResultsTable defs={enabledDefs} states={states} numRuns={numRuns} />
          )}
        </div>
      </div>

      {/* Share banner — appears after all runs finish */}
      {allRunsDone && !isRunning && (() => {
        const report = buildReport()
        const winner = report.providers.length > 0
          ? report.providers.reduce((a, b) => a.p50ToksPerSec >= b.p50ToksPerSec ? a : b)
          : null
        const deployHref = winner ? `/templates?provider=${winner.id}` : '/templates'
        return (
          <div style={{ marginTop: 24, padding: '18px 22px', background: 'linear-gradient(135deg, rgba(59,91,255,0.12) 0%, rgba(232,121,249,0.08) 100%)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>
                {winner ? <>Winner: <span style={{ color: winner.color }}>{winner.name}</span> · {winner.p50ToksPerSec.toFixed(0)} tok/s</> : 'Benchmark complete'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Share a link with OG preview · clone the run · or deploy the winning provider directly.
              </div>
              {winner && (
                <code style={{ fontSize: 11, color: '#1e293b', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>
                  run-{buildRunHash(prompt, enabledDefs.map(d => ({ id: d.id, model: d.model })), numRuns)}
                </code>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={shareReport} style={{ padding: '9px 20px', background: '#3B5BFF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {shareMsg ?? '↗ Share Report'}
              </button>
              <a href={deployHref} style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                Deploy {winner?.name ?? 'winner'} →
              </a>
            </div>
          </div>
        )
      })()}

      <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(59,91,255,0.07)', border: '1px solid rgba(59,91,255,0.15)', borderRadius: 10, fontSize: 12, color: '#475569' }}>
        <strong style={{ color: '#93c5fd' }}>How it works:</strong> Requests are proxied server-side (no CORS issues). RAIS, OpenAI, Anthropic, and Groq response formats are all detected automatically for token counting. API keys are held in-memory only and never stored.
      </div>
    </main>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{children}</div>
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: 22,
}

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  padding: 18,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 16,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: '#e2e8f0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 18px',
  background: '#3B5BFF',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}
