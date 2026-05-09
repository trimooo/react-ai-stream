import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'react-ai-stream · custom UI example',
  description: 'Demonstrates useAIChat wired to a fully custom Tailwind UI — no @react-ai-stream/ui dependency.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
