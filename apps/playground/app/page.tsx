import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Stream Studio — The Platform for AI Streaming Infrastructure',
  description: 'Inspect, benchmark, and compare any SSE AI streaming endpoint. Prove RAIS compliance. Ship faster.',
}

const FEATURES = [
  {
    href: '/inspect',
    icon: '🔭',
    name: 'Stream Inspector',
    desc: 'Paste any endpoint, fire a request, see live SSE frames, timing bars, and RAIS compliance in real time. Session history included.',
    color: '#3B5BFF',
    badge: 'Core tool',
  },
  {
    href: '/compare',
    icon: '⚖️',
    name: 'Protocol Diff',
    desc: 'Run two endpoints simultaneously. Side-by-side TTFB, tok/s, token count, and compliance — with delta percentages.',
    color: '#e879f9',
    badge: 'Compare',
  },
  {
    href: '/benchmark',
    icon: '⚡',
    name: 'Benchmark',
    desc: 'Run N rounds across Groq, OpenAI, Anthropic, Ollama, and local servers. See P50 latency, throughput, and cost estimates.',
    color: '#f59e0b',
    badge: 'Performance',
  },
  {
    href: '/inspect',
    icon: '▶',
    name: 'Stream Replay',
    desc: 'Record any stream, then replay it at original speed, step-by-step, or at 10× — a debugger for SSE timing and event order.',
    color: '#22c55e',
    badge: 'Debugger',
  },
  {
    href: '/templates',
    icon: '📦',
    name: 'Template Generator',
    desc: 'Choose platform + provider, get a complete scaffolded project. Next.js, Vite, Express, FastAPI, HTML — any stack.',
    color: '#10b981',
    badge: 'Scaffold',
  },
  {
    href: '/inspect',
    icon: '✓',
    name: 'RAIS Compliance',
    desc: 'Run the full RAIS v1 suite: type fields, text/done/error events, event ordering, JSON validity, unknown frame detection.',
    color: '#4ade80',
    badge: 'Protocol',
  },
]

const PROVIDERS = [
  { name: 'Groq', model: 'Llama 3.3', color: '#f59e0b' },
  { name: 'OpenAI', model: 'GPT-4o mini', color: '#10b981' },
  { name: 'Anthropic', model: 'Claude Haiku', color: '#e879f9' },
  { name: 'Ollama', model: 'Local models', color: '#94a3b8' },
  { name: 'Any RAIS', model: 'endpoint', color: '#3B5BFF' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Paste any SSE endpoint', desc: 'Local server, hosted API, Groq, OpenAI, Anthropic — anything that streams.' },
  { step: '02', title: 'Fire a test stream', desc: 'Requests proxy through the studio server, eliminating CORS entirely.' },
  { step: '03', title: 'Inspect, compare, fix', desc: 'See every raw frame, check compliance, benchmark against competitors, generate starter code.' },
]

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

      {/* HERO */}
      <section style={{ padding: '80px 0 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,91,255,0.12)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 20, padding: '4px 14px', marginBottom: 24, fontSize: 12, color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Open platform · RAIS Protocol v1
        </div>
        <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(2.4rem,6vw,4rem)', fontWeight: 900, letterSpacing: '-0.05em', color: '#f1f5f9', lineHeight: 1.05 }}>
          The DevTools for<br />
          <span style={{ color: '#3B5BFF' }}>AI Streaming</span> Infrastructure
        </h1>
        <p style={{ margin: '0 auto 36px', maxWidth: 540, fontSize: 18, color: '#64748b', lineHeight: 1.6 }}>
          Inspect any SSE endpoint. Benchmark providers. Prove RAIS compliance.
          {' '}<strong style={{ color: '#94a3b8' }}>Test in seconds, no setup required.</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/inspect" style={{ padding: '13px 28px', background: '#3B5BFF', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Inspect an endpoint →
          </a>
          <a href="/benchmark" style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)' }}>
            ⚡ Run benchmark
          </a>
        </div>
      </section>

      {/* ANIMATED MOCK TERMINAL */}
      <section style={{ marginBottom: 72 }}>
        <div style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
          padding: '0', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          {/* title bar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#334155', fontFamily: 'ui-monospace, monospace' }}>
              POST http://localhost:3001/api/chat — AI Stream Studio
            </div>
            <div style={{ padding: '2px 8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 4, fontSize: 10, color: '#4ade80', fontWeight: 600 }}>
              RAIS ✓
            </div>
          </div>
          {/* mock stream output */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* SSE frames */}
            <div style={{ padding: '20px', borderRight: '1px solid rgba(255,255,255,0.06)', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: 'system-ui' }}>Raw SSE Frames</div>
              {[
                { t: '  0ms', d: '{"type":"text","text":"SSE"}', c: '#3B5BFF' },
                { t: ' 18ms', d: '{"type":"text","text":" streaming"}', c: '#3B5BFF' },
                { t: ' 52ms', d: '{"type":"text","text":" works"}', c: '#3B5BFF' },
                { t: ' 71ms', d: '{"type":"text","text":" by"}', c: '#3B5BFF' },
                { t: '102ms', d: '{"type":"text","text":" sending"}', c: '#3B5BFF' },
                { t: '134ms', d: '{"type":"text","text":" each"}', c: '#3B5BFF' },
                { t: '168ms', d: '{"type":"text","text":" token"}', c: '#3B5BFF' },
                { t: '203ms', d: '{"type":"done"}', c: '#22c55e' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, opacity: 0.85 + i * 0.02 }}>
                  <span style={{ color: '#334155', minWidth: 42 }}>{row.t}</span>
                  <span style={{ color: row.c }}>{row.d}</span>
                </div>
              ))}
            </div>
            {/* stats */}
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: 'system-ui' }}>Live Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'TTFB', value: '18ms', color: '#22c55e' },
                  { label: 'Elapsed', value: '203ms', color: '#f1f5f9' },
                  { label: 'Tokens', value: '7', color: '#f1f5f9' },
                  { label: 'Tok/s', value: '34.5', color: '#3B5BFF' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'system-ui' }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace' }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 6 }}>✓ RAIS Protocol Compliant</div>
                {['All events have type field', 'text events have text field', 'done event is last', 'No unknown event types'].map(r => (
                  <div key={r} style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>✓ {r}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROVIDERS */}
      <section style={{ marginBottom: 72, textAlign: 'center' }}>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Works with every provider</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PROVIDERS.map(p => (
            <div key={p.name} style={{ padding: '8px 20px', background: `${p.color}0f`, border: `1px solid ${p.color}33`, borderRadius: 30, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.name}</span>
              <span style={{ fontSize: 11, color: '#475569' }}>{p.model}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ marginBottom: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
            Everything you need to ship AI streaming right
          </h2>
          <p style={{ margin: 0, color: '#475569', fontSize: 15 }}>Six purpose-built tools, one unified workspace.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <a key={f.name} href={f.href} style={{ display: 'block', textDecoration: 'none', padding: '24px', background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 14, transition: 'border-color 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: f.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{f.badge}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginBottom: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
            Zero setup. Test in seconds.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} style={{ padding: '24px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, position: 'relative' }}>
              {i < HOW_IT_WORKS.length - 1 && (
                <div style={{ position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#1e3a5f', zIndex: 1 }}>→</div>
              )}
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e3a5f', letterSpacing: '-0.05em', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>{step.step}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{step.title}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginBottom: 80, textAlign: 'center', padding: '56px 40px', background: 'rgba(59,91,255,0.07)', border: '1px solid rgba(59,91,255,0.15)', borderRadius: 20 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
          Start inspecting in 30 seconds
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 15, color: '#64748b' }}>
          No account. No install. Just paste an endpoint and go.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/inspect" style={{ padding: '12px 28px', background: '#3B5BFF', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            Open Inspector →
          </a>
          <a href="/benchmark" style={{ padding: '12px 28px', background: 'transparent', color: '#93c5fd', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, border: '1px solid rgba(59,91,255,0.35)' }}>
            Run Benchmark
          </a>
          <a href="https://react-ai-stream-docs.vercel.app/spec" target="_blank" rel="noreferrer" style={{ padding: '12px 28px', background: 'transparent', color: '#475569', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)' }}>
            RAIS Spec ↗
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#334155' }}>
          AI Stream Studio · Built on <a href="https://react-ai-stream-docs.vercel.app/spec" style={{ color: '#3B5BFF', textDecoration: 'none' }}>RAIS Protocol v1</a>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { href: 'https://github.com/trimooo/react-ai-stream', label: 'GitHub' },
            { href: 'https://react-ai-stream-docs.vercel.app', label: 'Docs' },
            { href: '/ecosystem', label: 'Ecosystem' },
          ].map(l => (
            <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ fontSize: 13, color: '#334155', textDecoration: 'none' }}>{l.label}</a>
          ))}
        </div>
      </footer>
    </main>
  )
}
