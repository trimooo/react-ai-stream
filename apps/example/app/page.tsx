import { DemoChat } from '@/components/DemoChat'

export default function Home() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ marginBottom: 8, fontSize: '1.5rem' }}>react-ai-stream demo</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Both panels use the same <code>useAIChat</code> hook with a custom endpoint — backend-agnostic streaming.
      </p>
      <DemoChat />
    </main>
  )
}
