import { DemoChat } from '@/components/DemoChat'
import { CopyCommand } from '@/components/CopyCommand'

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #c4b5fd !important; }
        .cta-primary { transition: background 0.15s, transform 0.1s; }
        .cta-primary:hover { background: #6d28d9 !important; transform: translateY(-1px); }
        .cta-ghost { transition: background 0.15s, border-color 0.15s; }
        .cta-ghost:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.3) !important; }
        .feature-card { transition: box-shadow 0.15s, transform 0.15s; }
        .feature-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .source-btn { transition: background 0.15s; }
        .source-btn:hover { background: #f1f5f9 !important; }
        @media (max-width: 768px) {
          .hero-title { font-size: 2rem !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .code-grid { grid-template-columns: 1fr !important; }
          .model-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#020817', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.4px', color: '#f1f5f9' }}>react-ai-stream</span>
            <span style={{ fontSize: 11, background: 'rgba(124,58,237,0.25)', color: '#c4b5fd', padding: '2px 8px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(124,58,237,0.35)' }}>v1.0.0</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="https://react-ai-stream-docs.vercel.app" className="nav-link" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>Docs</a>
            <a href="https://www.npmjs.com/package/@react-ai-stream/react" target="_blank" rel="noreferrer" className="nav-link" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>npm</a>
            <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noreferrer" className="nav-link" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>GitHub</a>
            <a href="https://github.com/trimooo/react-ai-stream/tree/master/apps/example" target="_blank" rel="noreferrer" className="source-btn" style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', textDecoration: 'none', padding: '5px 14px', borderRadius: 6, fontWeight: 500 }}>
              View source ↗
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, #020817 0%, #0f0a1e 40%, #0d1a2e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '80px 24px 72px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          {/* Protocol badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '4px 14px 4px 8px', marginBottom: 32, fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            RAIS Protocol v1 · Live demo
          </div>

          <h1 className="hero-title" style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 18px', color: '#f1f5f9', lineHeight: 1.15 }}>
            Universal AI streaming<br />infrastructure.
          </h1>

          <p style={{ fontSize: '1.1rem', color: '#94a3b8', margin: '0 0 6px', lineHeight: 1.65 }}>
            One wire protocol. Any server. Any client framework.
          </p>
          <p style={{ fontSize: '1rem', color: '#64748b', margin: '0 0 36px', lineHeight: 1.65 }}>
            Works with Anthropic, OpenAI, Groq, or any streaming endpoint.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
            <CopyCommand />
            <a href="https://react-ai-stream-docs.vercel.app/quickstart" className="cta-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', textDecoration: 'none', padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
              Quickstart →
            </a>
          </div>

          {/* Protocol preview */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 20px', textAlign: 'left', fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.8, maxWidth: 420, margin: '0 auto' }}>
            <div style={{ color: '#64748b', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>RAIS wire format</div>
            <div><span style={{ color: '#7c3aed' }}>data:</span> <span style={{ color: '#86efac' }}>{`{"type":"text","text":"Hello"}`}</span></div>
            <div><span style={{ color: '#7c3aed' }}>data:</span> <span style={{ color: '#86efac' }}>{`{"type":"text","text":", world"}`}</span></div>
            <div><span style={{ color: '#7c3aed' }}>data:</span> <span style={{ color: '#fbbf24' }}>{`{"type":"done"}`}</span></div>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* ── Live demo ─────────────────────────────────────── */}
        <div style={{ margin: '56px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Three models, one prompt</h2>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Send a message and watch all three respond simultaneously via RAIS</span>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            {/* Demo header bar */}
            <div style={{ background: '#0f172a', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontFamily: 'monospace' }}>
                POST /api/chat → text/event-stream
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', fontWeight: 600 }}>● LIVE</span>
            </div>
            <div style={{ padding: 20 }}>
              <DemoChat />
            </div>
          </div>
        </div>

        {/* ── Features grid ─────────────────────────────────── */}
        <div style={{ marginTop: 72 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>What you get</h2>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: '⚛', title: 'useAIChat hook', desc: 'Messages, loading, error, stop — all managed. Zero boilerplate.', color: '#61dafb' },
              { icon: '🌐', title: 'Any backend', desc: 'Anthropic, OpenAI, Groq, FastAPI, Express — same hook, any server.', color: '#7c3aed' },
              { icon: '💚', title: 'Vue 3 support', desc: 'Same useAIChat API surface as a Vue 3 composable.', color: '#42b883' },
              { icon: '⚡', title: 'Event hooks', desc: 'onToken, onComplete, onError for side-effects and analytics.', color: '#f59e0b' },
              { icon: '🎨', title: 'Drop-in UI', desc: '<Chat /> with Markdown + syntax highlighting, or bring your own.', color: '#ec4899' },
              { icon: '✓', title: 'Full TypeScript', desc: 'Strict types, ESM + CJS, 117 passing tests across 8 packages.', color: '#22c55e' },
            ].map(({ icon, title, desc, color }) => (
              <div key={title} className="feature-card" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                    {icon}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Code + comparison ─────────────────────────────── */}
        <div className="code-grid" style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 28, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>As simple as this</h2>
            <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 12, padding: '22px 24px', fontSize: 13, lineHeight: 1.75, margin: 0, overflowX: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}><code>{`import { useAIChat } from '@react-ai-stream/react'
import { Chat } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

export default function Page() {
  const {
    messages, sendMessage,
    loading, stop,
  } = useAIChat({
    endpoint: '/api/chat',
    // OpenAI → Anthropic → Groq?
    // Just change the route. Not the hook.
  })

  return (
    <Chat
      messages={messages}
      onSend={sendMessage}
      onStop={stop}
      loading={loading}
    />
  )
}`}</code></pre>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>The RAIS ecosystem</h2>
            {[
              { pkg: '@react-ai-stream/react', note: 'useAIChat hook + AIChatProvider', size: '~8 kB', color: '#61dafb' },
              { pkg: '@react-ai-stream/ui',    note: '<Chat>, <MessageList>, <MarkdownRenderer>', size: '~12 kB', color: '#7c3aed' },
              { pkg: '@react-ai-stream/vue',   note: 'Vue 3 composable — same API', size: '~9 kB', color: '#42b883' },
              { pkg: '@react-ai-stream/express', note: 'raisMiddleware() for Express', size: '~4 kB', color: '#f7df1e' },
              { pkg: 'rais (Python)',           note: 'stream_response() for FastAPI', size: 'pure py', color: '#3b82f6' },
            ].map(({ pkg, note, size, color }) => (
              <div key={pkg} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pkg}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{note}</div>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>{size}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <a href="https://react-ai-stream-docs.vercel.app" target="_blank" rel="noreferrer"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#7c3aed', color: '#fff', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 600 }}>
                Full docs →
              </a>
              <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noreferrer"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', color: '#374151', textDecoration: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 600 }}>
                GitHub ↗
              </a>
            </div>
          </div>
        </div>

        {/* ── Protocol callout ──────────────────────────────── */}
        <div style={{ marginTop: 64, background: 'linear-gradient(135deg, #0f172a 0%, #1e1040 100%)', borderRadius: 16, padding: '36px 40px', display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: 10 }}>RAIS Protocol v1</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px', lineHeight: 1.3 }}>
              Three event types.<br />That's the entire spec.
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.65 }}>
              Any server in any language that emits <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3, fontSize: 12, color: '#a78bfa' }}>text</code>, <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3, fontSize: 12, color: '#fbbf24' }}>done</code>, and <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3, fontSize: 12, color: '#f87171' }}>error</code> events over SSE is automatically compatible with every RAIS client.
            </p>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.9, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 20px', flexShrink: 0 }}>
            <div><span style={{ color: '#7c3aed' }}>data:</span> <span style={{ color: '#a78bfa' }}>{`{"type":"text","text":"…"}`}</span></div>
            <div><span style={{ color: '#7c3aed' }}>data:</span> <span style={{ color: '#fbbf24' }}>{`{"type":"done"}`}</span></div>
            <div><span style={{ color: '#7c3aed' }}>data:</span> <span style={{ color: '#f87171' }}>{`{"type":"error","error":"…"}`}</span></div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#475569' }}>
              npx rais-compliance http://localhost:3000/api/chat
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #e5e7eb', background: '#fff', padding: '24px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>react-ai-stream</span>
          <span style={{ color: '#e2e8f0' }}>·</span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>MIT License</span>
          <span style={{ color: '#e2e8f0' }}>·</span>
          <a href="https://github.com/trimooo/react-ai-stream" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>GitHub</a>
          <span style={{ color: '#e2e8f0' }}>·</span>
          <a href="https://www.npmjs.com/package/@react-ai-stream/react" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>npm</a>
          <span style={{ color: '#e2e8f0' }}>·</span>
          <a href="https://react-ai-stream-docs.vercel.app" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Docs</a>
        </div>
      </footer>
    </>
  )
}
