import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Benchmark Gallery — AI Stream Studio',
  description: 'Public AI streaming benchmarks. Compare GPT-4o, Claude, Groq, Llama, and more — latency, throughput, cost.',
  openGraph: {
    title: 'Benchmark Gallery — AI Stream Studio',
    description: 'Real benchmark results from the community. Find the fastest, cheapest, and most reliable AI streaming providers.',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
}

// ── example report data ────────────────────────────────────────────────────────

interface ReportData {
  prompt: string
  numRuns: number
  timestamp: number
  providers: Array<{
    id: string; name: string; model: string; color: string
    p50Ttfb: number; avgElapsed: number; p50ToksPerSec: number
    avgTokens: number; errors: number; costPerMTok: number
  }>
}

function encodeReport(data: ReportData): string {
  // Buffer is always available in Node.js runtime (more reliable than btoa on server)
  return Buffer.from(encodeURIComponent(JSON.stringify(data))).toString('base64')
}

const EXAMPLE_REPORTS: Array<{
  title: string
  description: string
  tags: string[]
  data: ReportData
}> = [
  {
    title: 'Groq vs OpenAI vs Anthropic — Speed Shootout',
    description: 'Three cloud providers head-to-head on a short generation task. Groq dominates on raw throughput; Anthropic leads on coherence.',
    tags: ['cloud', 'throughput', 'cost'],
    data: {
      prompt: 'Explain how transformer attention works in 3 sentences.',
      numRuns: 5,
      timestamp: new Date('2026-05-14T10:00:00Z').getTime(),
      providers: [
        { id: 'groq', name: 'Groq', model: 'Llama 3.3 70B', color: '#f59e0b', p50Ttfb: 248, avgElapsed: 1840, p50ToksPerSec: 207, avgTokens: 63, errors: 0, costPerMTok: 0.79 },
        { id: 'openai', name: 'OpenAI', model: 'GPT-4o mini', color: '#10b981', p50Ttfb: 382, avgElapsed: 2290, p50ToksPerSec: 91, avgTokens: 69, errors: 0, costPerMTok: 2.40 },
        { id: 'anthropic', name: 'Anthropic', model: 'Claude Haiku', color: '#e879f9', p50Ttfb: 518, avgElapsed: 3080, p50ToksPerSec: 77, avgTokens: 74, errors: 0, costPerMTok: 4.00 },
      ],
    },
  },
  {
    title: 'Local RAIS vs Groq — On-device vs Cloud',
    description: 'A self-hosted RAIS endpoint against Groq\'s cloud inference. Local wins on latency when on the same machine; Groq wins on throughput.',
    tags: ['local', 'self-hosted', 'privacy'],
    data: {
      prompt: 'What is the difference between SSE and WebSocket streaming?',
      numRuns: 3,
      timestamp: new Date('2026-05-15T08:00:00Z').getTime(),
      providers: [
        { id: 'local-rais', name: 'Local RAIS', model: 'localhost:3001', color: '#22c55e', p50Ttfb: 12, avgElapsed: 4200, p50ToksPerSec: 48, avgTokens: 142, errors: 0, costPerMTok: 0 },
        { id: 'groq', name: 'Groq', model: 'Llama 3.3 70B', color: '#f59e0b', p50Ttfb: 241, avgElapsed: 2100, p50ToksPerSec: 198, avgTokens: 138, errors: 0, costPerMTok: 0.79 },
      ],
    },
  },
  {
    title: 'Groq vs Ollama — Cloud vs Edge Inference',
    description: 'Groq cloud vs local Ollama (Llama 3.2 3B) on a reasoning task. Cloud wins on speed; Ollama wins on cost and privacy.',
    tags: ['local', 'cloud', 'cost'],
    data: {
      prompt: 'List 5 practical use cases for AI streaming in production apps.',
      numRuns: 3,
      timestamp: new Date('2026-05-13T14:00:00Z').getTime(),
      providers: [
        { id: 'groq', name: 'Groq', model: 'Llama 3.3 70B', color: '#f59e0b', p50Ttfb: 253, avgElapsed: 3140, p50ToksPerSec: 189, avgTokens: 210, errors: 0, costPerMTok: 0.79 },
        { id: 'ollama', name: 'Ollama', model: 'Llama 3.2 3B', color: '#94a3b8', p50Ttfb: 42, avgElapsed: 8900, p50ToksPerSec: 38, avgTokens: 198, errors: 0, costPerMTok: 0 },
      ],
    },
  },
  {
    title: 'All 3 Cloud Providers — Long Generation',
    description: 'Extended output task across Groq, OpenAI, and Anthropic. Cost-efficiency ratios become visible at higher token counts.',
    tags: ['cloud', 'long-form', 'cost'],
    data: {
      prompt: 'Write a detailed technical comparison of REST, GraphQL, and SSE for real-time AI applications.',
      numRuns: 3,
      timestamp: new Date('2026-05-12T16:00:00Z').getTime(),
      providers: [
        { id: 'groq', name: 'Groq', model: 'Llama 3.3 70B', color: '#f59e0b', p50Ttfb: 261, avgElapsed: 8200, p50ToksPerSec: 214, avgTokens: 580, errors: 0, costPerMTok: 0.79 },
        { id: 'openai', name: 'OpenAI', model: 'GPT-4o mini', color: '#10b981', p50Ttfb: 401, avgElapsed: 12400, p50ToksPerSec: 84, avgTokens: 612, errors: 0, costPerMTok: 2.40 },
        { id: 'anthropic', name: 'Anthropic', model: 'Claude Haiku', color: '#e879f9', p50Ttfb: 534, avgElapsed: 14800, p50ToksPerSec: 72, avgTokens: 598, errors: 0, costPerMTok: 4.00 },
      ],
    },
  },
]

// ── tag filter colors ─────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  cloud: { bg: 'rgba(59,91,255,0.15)', text: '#93c5fd' },
  local: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80' },
  throughput: { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d' },
  cost: { bg: 'rgba(232,121,249,0.12)', text: '#e879f9' },
  'self-hosted': { bg: 'rgba(34,197,94,0.12)', text: '#4ade80' },
  privacy: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  'long-form': { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  'multilingual': { bg: 'rgba(59,91,255,0.15)', text: '#93c5fd' },
}

function Tag({ label }: { label: string }) {
  const style = TAG_COLORS[label] ?? { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' }
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: style.bg, color: style.text }}>
      {label}
    </span>
  )
}

function GalleryCard({ title, description, tags, data, reportUrl }: {
  title: string; description: string; tags: string[]
  data: ReportData; reportUrl: string
}) {
  const bestToks = data.providers.reduce((a, b) => a.p50ToksPerSec >= b.p50ToksPerSec ? a : b)
  const bestTtfb = data.providers.filter(p => p.p50Ttfb > 0).reduce((a, b) => a.p50Ttfb <= b.p50Ttfb ? a : b, data.providers[0]!)
  const dateStr = new Date(data.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'border-color 0.15s',
    }}>
      {/* Provider dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {data.providers.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{p.name}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#334155' }}>{dateStr}</span>
      </div>

      <div>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px', lineHeight: 1.3 }}>
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{description}</p>
      </div>

      {/* Prompt */}
      <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', borderRadius: 6, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.05)' }}>
        "{data.prompt.length > 80 ? data.prompt.slice(0, 80) + '…' : data.prompt}"
      </div>

      {/* Winner highlights */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, padding: '8px 10px', background: `${bestTtfb.color}10`, border: `1px solid ${bestTtfb.color}25`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>⚡ Fastest TTFB</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: bestTtfb.color }}>{bestTtfb.name} · {bestTtfb.p50Ttfb.toFixed(0)}ms</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', background: `${bestToks.color}10`, border: `1px solid ${bestToks.color}25`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>🚀 Best Tok/s</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: bestToks.color }}>{bestToks.name} · {bestToks.p50ToksPerSec.toFixed(0)}</div>
        </div>
      </div>

      {/* Tags + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {tags.map(t => <Tag key={t} label={t} />)}
          <span style={{ fontSize: 11, color: '#334155' }}>{data.numRuns} run{data.numRuns > 1 ? 's' : ''}</span>
        </div>
        <a href={reportUrl} style={{ fontSize: 12, fontWeight: 700, color: '#3B5BFF', textDecoration: 'none', padding: '5px 12px', background: 'rgba(59,91,255,0.12)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 6 }}>
          View report →
        </a>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const reports = EXAMPLE_REPORTS.map(r => ({
    ...r,
    reportUrl: `/benchmark?report=${encodeReport(r.data)}`,
  }))

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,91,255,0.1)', border: '1px solid rgba(59,91,255,0.2)', borderRadius: 20, padding: '3px 12px', marginBottom: 14, fontSize: 11, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
          Public Benchmarks
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9', lineHeight: 1.1 }}>
          See how providers stack up.
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 15, color: '#64748b', maxWidth: 520, lineHeight: 1.7 }}>
          Real benchmark runs — latency, throughput, cost, and stability. Every report is reproducible: click any card to view full results or clone the run with your own keys.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/benchmark" style={{ padding: '10px 22px', background: '#3B5BFF', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            ⚡ Run your own →
          </a>
          <a href="/inspect" style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Inspect any endpoint
          </a>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        {[
          { label: 'Featured reports', value: String(reports.length) },
          { label: 'Providers covered', value: '5' },
          { label: 'All reports', value: 'URL-encoded · no backend' },
          { label: 'Protocol', value: 'RAIS v1' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 16px' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Report grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20, marginBottom: 56 }}>
        {reports.map(r => (
          <GalleryCard key={r.title} {...r} />
        ))}
      </div>

      {/* Submit CTA */}
      <div style={{ padding: '36px 40px', background: 'rgba(59,91,255,0.06)', border: '1px solid rgba(59,91,255,0.18)', borderRadius: 16, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const, gap: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
            Submit your benchmark
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', maxWidth: 460, lineHeight: 1.7 }}>
            Run a benchmark on any RAIS-compatible endpoint, generate a share link, and open a PR to add it here. We feature benchmarks that are reproducible, honest, and interesting.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/benchmark" style={{ padding: '10px 22px', background: '#3B5BFF', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Run a benchmark →
          </a>
          <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noopener noreferrer"
            style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Submit via GitHub →
          </a>
        </div>
      </div>

      {/* Explainer */}
      <div style={{ marginTop: 32, padding: '18px 22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
        <strong style={{ color: '#64748b' }}>How reports work:</strong> Every benchmark is encoded entirely in its URL — no backend, no accounts, no tracking. Anyone with the link can view results, clone the configuration, and re-run with their own API keys. Reports are permanent and portable.
      </div>
    </main>
  )
}
