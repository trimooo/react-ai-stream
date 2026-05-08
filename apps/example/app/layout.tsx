import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'react-ai-stream — AI streaming SDK for React',
  description: 'One hook. Any provider. Drop-in UI or bring your own. Works with Anthropic, OpenAI, Groq, or any streaming endpoint.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  )
}
