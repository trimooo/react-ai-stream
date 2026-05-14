import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'react-ai-stream — Universal AI streaming infrastructure',
  description: 'One wire protocol. Any server. Any client framework. Works with Anthropic, OpenAI, Groq, or any streaming endpoint.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc', color: '#0f172a', minHeight: '100vh' }}>
        {children}
        <Script defer data-domain="react-ai-stream-example.vercel.app" src="https://plausible.io/js/script.js" />
      </body>
    </html>
  )
}
