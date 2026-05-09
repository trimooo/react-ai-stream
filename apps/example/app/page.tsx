import { DemoChat } from '@/components/DemoChat'
import { CopyCommand } from '@/components/CopyCommand'

export default function Home() {
  return (
    <>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>react-ai-stream</span>
          <span style={{ fontSize: 12, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 20 }}>v0.1.3</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="https://www.npmjs.com/package/@react-ai-stream/react" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>npm</a>
            <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>GitHub</a>
            <a href="https://github.com/trimooo/react-ai-stream/tree/master/apps/example" target="_blank" rel="noreferrer" style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#374151', textDecoration: 'none', padding: '5px 12px', borderRadius: 6 }}>View source →</a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '52px 0 40px' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 14px', color: '#0f172a' }}>
            Backend-agnostic AI streaming for React
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', margin: '0 0 28px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            One hook. Any provider. Drop-in UI or bring your own.
            Works with Anthropic, OpenAI, Groq, or any streaming endpoint.
          </p>
          <CopyCommand />
        </div>

        {/* Demo */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Live demo</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>— three models streaming in parallel via Groq</span>
          </div>
          <DemoChat />
        </div>

        {/* Code snippet */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>As simple as this</h2>
            <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 10, padding: '18px 20px', fontSize: 13, lineHeight: 1.7, margin: 0, overflowX: 'auto' }}>{`import { useAIChat } from '@react-ai-stream/react'
import { Chat } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

export default function Page() {
  const { messages, sendMessage,
          loading, stop } = useAIChat({
    endpoint: '/api/chat',
  })

  return (
    <Chat
      messages={messages}
      onSend={sendMessage}
      onStop={stop}
      loading={loading}
    />
  )
}`}</pre>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>What you get</h2>
            {[
              ['useAIChat hook', 'Messages, loading, error, stop — all managed'],
              ['Any backend', 'Anthropic, OpenAI, Groq, or custom endpoint'],
              ['Event hooks', 'onToken, onComplete, onError for side-effects'],
              ['Drop-in UI', '<Chat /> with Markdown + syntax highlighting'],
              ['Full TypeScript', 'Strict types, ESM + CJS, 34 passing tests'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{title}</span>
                  <span style={{ color: '#64748b', fontSize: 14 }}> — {desc}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#0f172a', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                Read the docs →
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '20px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        MIT License ·{' '}
        <a href="https://github.com/trimooo/react-ai-stream" style={{ color: '#94a3b8' }}>GitHub</a>
        {' '}·{' '}
        <a href="https://www.npmjs.com/package/@react-ai-stream/react" style={{ color: '#94a3b8' }}>npm</a>
      </footer>
    </>
  )
}
