import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RAIS Cloud — Hosted AI Gateway',
  description: 'Multi-provider AI gateway built on RAIS Protocol. Retries, analytics, zero key exposure.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#020817',
        color: '#e2e8f0',
        minHeight: '100vh',
      }}>
        <header style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(2,8,23,0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" rx="14" fill="#0E1116"/>
                <path d="M28 22 H58 a16 16 0 0 1 0 32 H44 L62 78 H50 L34 56 H40 V46 H56 a6 6 0 0 0 0 -12 H40 V78 H28 Z" fill="#F6F4EF"/>
                <rect y="56" width="100" height="4" fill="#3B5BFF"/>
                <circle cx="86" cy="58" r="6" fill="#3B5BFF" stroke="#0E1116" strokeWidth="3"/>
              </svg>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#f1f5f9' }}>RAIS Cloud</div>
                <div style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Hosted Gateway</div>
              </div>
            </a>
            <nav style={{ display: 'flex', gap: 2 }}>
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/docs', label: 'Docs' },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', padding: '5px 12px', borderRadius: 6 }}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              <a href="https://react-ai-stream-playground.vercel.app" style={{ fontSize: 13, color: '#3B5BFF', textDecoration: 'none' }}>
                Studio ↗
              </a>
              <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
                GitHub
              </a>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
