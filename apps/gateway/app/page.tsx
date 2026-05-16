import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RAIS Cloud — Hosted AI Gateway',
}

export default function GatewayLanding() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,91,255,0.12)', border: '1px solid rgba(59,91,255,0.25)', borderRadius: 20, padding: '4px 14px', marginBottom: 20, fontSize: 11, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Private beta
        </div>
        <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 900, letterSpacing: '-0.05em', color: '#f1f5f9', lineHeight: 1.05 }}>
          One endpoint.<br />
          <span style={{ color: '#3B5BFF' }}>Every provider.</span>
        </h1>
        <p style={{ margin: '0 auto 40px', maxWidth: 480, fontSize: 16, color: '#64748b', lineHeight: 1.65 }}>
          RAIS Cloud is a hosted AI gateway that normalizes OpenAI, Anthropic, Groq, and Gemini into a single RAIS Protocol v1 stream.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://react-ai-stream-playground.vercel.app/cloud#waitlist" style={{ padding: '12px 28px', background: '#3B5BFF', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            Join waitlist →
          </a>
          <a href="/dashboard" style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
            Dashboard
          </a>
        </div>
      </div>

      {/* Endpoint preview */}
      <div style={{ marginBottom: 56, padding: '28px 32px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
        <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, fontFamily: 'system-ui' }}>Quick start — 2 steps</div>
        <div style={{ color: '#475569', marginBottom: 4 }}># 1. Get a free key — instant, no card</div>
        <div style={{ color: '#94a3b8', marginBottom: 16 }}>
          {'→ react-ai-stream-playground.vercel.app/cloud'}
        </div>
        <div style={{ color: '#475569', marginBottom: 4 }}># 2. Add one line to your app</div>
        <div style={{ color: '#93c5fd' }}>
          {'useAIChat({'}
          <br />{'  endpoint: '}
          <span style={{ color: '#4ade80' }}>"https://react-ai-stream-gateway.vercel.app/api/v1/chat"</span>
          {','}
          <br />{'  extraHeaders: { Authorization: `Bearer ras_test_YOUR_KEY` },'}
          <br />{'})'}
        </div>
        <div style={{ color: '#475569', marginTop: 16, marginBottom: 4 }}># Check usage + run live tests</div>
        <div style={{ color: '#94a3b8' }}>{'→ /dashboard  (enter your key)'}</div>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {[
          { icon: '⚡', title: 'Multi-provider routing', desc: 'Groq · OpenAI · Anthropic · Gemini. Switch with one field, no code change.' },
          { icon: '🔄', title: 'Automatic retries', desc: 'Failed requests fall through the fallback chain silently.' },
          { icon: '📊', title: 'Usage analytics', desc: 'Tokens, cost, latency — per key, per provider, per day.' },
          { icon: '🔑', title: 'Key management', desc: 'Create, revoke, and audit API keys from the dashboard.' },
          { icon: '✓', title: 'RAIS v1 compliant', desc: 'Every response passes the full RAIS Protocol compliance suite.' },
          { icon: '🚫', title: 'Rate limiting', desc: 'Per-key sliding window. Never burn through a provider quota.' },
        ].map(f => (
          <div key={f.title} style={{ padding: '22px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{f.title}</div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
