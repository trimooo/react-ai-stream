'use client'

import { useState } from 'react'

export function CopyCommand() {
  const [copied, setCopied] = useState(false)
  const cmd = 'npm install @react-ai-stream/react @react-ai-stream/ui'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cmd).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, padding: '10px 16px',
        fontFamily: 'monospace', fontSize: 13,
        cursor: 'pointer',
      }}
      onClick={handleCopy}
    >
      <span style={{ color: '#7c3aed', fontWeight: 700 }}>$</span>
      <span style={{ color: '#e2e8f0' }}>{cmd}</span>
      <span style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 4,
        background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.12)'}`,
        color: copied ? '#86efac' : '#94a3b8',
        transition: 'all 0.2s', whiteSpace: 'nowrap',
      }}>
        {copied ? '✓ copied' : 'copy'}
      </span>
    </div>
  )
}
