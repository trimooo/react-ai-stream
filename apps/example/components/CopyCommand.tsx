'use client'

export function CopyCommand() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#0f172a', borderRadius: 8, padding: '10px 18px', fontFamily: 'monospace', fontSize: 14 }}>
      <span style={{ color: '#94a3b8' }}>$</span>
      <span style={{ color: '#e2e8f0' }}>npm install @react-ai-stream/react @react-ai-stream/ui</span>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText('npm install @react-ai-stream/react @react-ai-stream/ui')
        }}
        style={{ background: 'none', border: '1px solid #334155', borderRadius: 4, padding: '2px 8px', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
      >
        copy
      </button>
    </div>
  )
}
