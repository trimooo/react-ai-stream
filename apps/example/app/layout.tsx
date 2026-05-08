import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'react-ai-stream example',
  description: 'AI Streaming Chat SDK demo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        {children}
      </body>
    </html>
  )
}
