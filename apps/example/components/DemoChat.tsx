'use client'

import { useAIChat } from '@react-ai-stream/react'
import { Chat } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

export function DemoChat() {
  const claude = useAIChat({ endpoint: '/api/chat' })
  const gpt = useAIChat({ endpoint: '/api/chat?provider=groq' })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '80vh' }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, flexShrink: 0 }}>
          Anthropic Claude (custom endpoint)
        </div>
        {claude.error && (
          <div style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', fontSize: 13, flexShrink: 0 }}>
            {claude.error}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Chat
            messages={claude.messages}
            onSend={claude.sendMessage}
            onStop={claude.stop}
            loading={claude.loading}
            placeholder="Ask Claude anything…"
          />
        </div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, flexShrink: 0 }}>
          Groq — Llama 3.3 70B (custom endpoint)
        </div>
        {gpt.error && (
          <div style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', fontSize: 13, flexShrink: 0 }}>
            {gpt.error}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Chat
            messages={gpt.messages}
            onSend={gpt.sendMessage}
            onStop={gpt.stop}
            loading={gpt.loading}
            placeholder="Ask GPT anything…"
          />
        </div>
      </div>
    </div>
  )
}
