import type { Metadata } from 'next'
import { NavLinks } from '@/components/NavLinks'

export const metadata: Metadata = {
  metadataBase: new URL('https://react-ai-stream-playground.vercel.app'),
  title: 'AI Stream Studio — RAIS Protocol Tooling',
  description: 'Benchmark, inspect, and compare AI streaming providers. The definitive developer tool for the RAIS protocol.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'AI Stream Studio',
    description: 'Benchmark OpenAI, Anthropic, Groq and more — compare latency, throughput, compliance.',
    type: 'website',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Stream Studio — RAIS Protocol',
    description: 'Benchmark, inspect, and compare AI streaming providers.',
    images: ['/api/og'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </head>
      <body style={{
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#020817',
        color: '#e2e8f0',
        minHeight: '100vh',
      }}>
        <header style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(2,8,23,0.92)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
                <rect x="0" y="0" width="100" height="100" rx="14" fill="#0E1116"/>
                <path d="M28 22 H58 a16 16 0 0 1 0 32 H44 L62 78 H50 L34 56 H40 V46 H56 a6 6 0 0 0 0 -12 H40 V78 H28 Z" fill="#F6F4EF"/>
                <rect x="0" y="56" width="100" height="4" fill="#3B5BFF"/>
                <circle cx="86" cy="58" r="6" fill="#3B5BFF" stroke="#0E1116" strokeWidth="3"/>
              </svg>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '-0.3px', color: '#f1f5f9' }}>AI Stream Studio</div>
                <div style={{ fontSize: 10, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>RAIS Protocol</div>
              </div>
            </a>

            <NavLinks />

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
              <a href="https://react-ai-stream-docs.vercel.app/spec" target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: '#3B5BFF', textDecoration: 'none', fontWeight: 500, padding: '5px 12px', borderRadius: 6 }}>
                RAIS Spec ↗
              </a>
              <a href="https://github.com/trimooo/react-ai-stream" target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500, padding: '5px 12px', borderRadius: 6 }}>
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
