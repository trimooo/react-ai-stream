import React, { useState } from 'react'

type PackageInfo = {
  name: string
  npm: string
  size: string
  badge: string
  description: string
  install: string
  snippet: string
  lang: string
  status: 'stable' | 'new' | 'optional'
  href: string
  color: string
}

const packages: PackageInfo[] = [
  {
    name: '@react-ai-stream/react',
    npm: 'https://www.npmjs.com/package/@react-ai-stream/react',
    size: '~8 kB',
    badge: '⚛',
    description: 'useAIChat hook + AIChatProvider context. Zero-dep streaming state management for React.',
    install: 'npm install @react-ai-stream/react',
    snippet: `import { useAIChat } from '@react-ai-stream/react'

const { messages, sendMessage, loading, stop } = useAIChat({
  endpoint: '/api/chat',
})`,
    lang: 'tsx',
    status: 'stable',
    href: '/reference/useaichat',
    color: '#61dafb',
  },
  {
    name: '@react-ai-stream/ui',
    npm: 'https://www.npmjs.com/package/@react-ai-stream/ui',
    size: '~12 kB',
    badge: '🎨',
    description: '<Chat>, <MessageList>, <MarkdownRenderer> — zero-config UI components for the hook.',
    install: 'npm install @react-ai-stream/react @react-ai-stream/ui',
    snippet: `import { Chat } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

<Chat
  messages={messages}
  onSend={sendMessage}
  onStop={stop}
  loading={loading}
/>`,
    lang: 'tsx',
    status: 'stable',
    href: '/ui',
    color: '#7c3aed',
  },
  {
    name: '@react-ai-stream/vue',
    npm: 'https://www.npmjs.com/package/@react-ai-stream/vue',
    size: '~9 kB',
    badge: '💚',
    description: 'useAIChat composable for Vue 3. Same API surface as the React hook.',
    install: 'npm install @react-ai-stream/vue',
    snippet: `import { useAIChat } from '@react-ai-stream/vue'

const { messages, sendMessage, loading, stop } = useAIChat({
  endpoint: '/api/chat',
})`,
    lang: 'ts',
    status: 'new',
    href: '/adapters/vue',
    color: '#42b883',
  },
  {
    name: '@react-ai-stream/express',
    npm: 'https://www.npmjs.com/package/@react-ai-stream/express',
    size: '~4 kB',
    badge: '🚂',
    description: 'raisMiddleware() — one-line Express middleware that emits RAIS-compliant SSE.',
    install: 'npm install @react-ai-stream/express',
    snippet: `import { raisMiddleware } from '@react-ai-stream/express'

app.post('/api/chat', raisMiddleware({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
}))`,
    lang: 'ts',
    status: 'new',
    href: '/adapters/express',
    color: '#f7df1e',
  },
  {
    name: '@react-ai-stream/core',
    npm: 'https://www.npmjs.com/package/@react-ai-stream/core',
    size: '~6 kB',
    badge: '⚙',
    description: 'SSE parser, message store, abort utils. No framework dependency — used by all clients.',
    install: 'npm install @react-ai-stream/core',
    snippet: `import { parseSSE, createMessageStore } from '@react-ai-stream/core'

// Parse RAIS events from any ReadableStream
for await (const event of parseSSE(stream)) {
  if (event.type === 'text') console.log(event.text)
  if (event.type === 'done') break
}`,
    lang: 'ts',
    status: 'stable',
    href: '/reference/types',
    color: '#94a3b8',
  },
  {
    name: '@react-ai-stream/devtools',
    npm: 'https://www.npmjs.com/package/@react-ai-stream/devtools',
    size: '~8 kB',
    badge: '🔍',
    description: 'Floating DevTools panel — live token log, timing, tok/s. Drop into any RAIS app.',
    install: 'npm install @react-ai-stream/devtools',
    snippet: `import { RAISDevTools } from '@react-ai-stream/devtools'

// Add to any component or layout
<RAISDevTools position="bottom-right" />`,
    lang: 'tsx',
    status: 'stable',
    href: '/devtools',
    color: '#f59e0b',
  },
  {
    name: 'rais (Python)',
    npm: 'https://pypi.org/project/rais/',
    size: 'pure Python',
    badge: '🐍',
    description: 'stream_response() helper for FastAPI, Starlette, Django. Any Python server becomes RAIS-compliant.',
    install: 'pip install rais',
    snippet: `from rais import stream_response
from fastapi import FastAPI

app = FastAPI()

@app.post("/api/chat")
async def chat(req: ChatRequest):
    return stream_response(openai_stream(req.messages))`,
    lang: 'python',
    status: 'new',
    href: '/adapters/python',
    color: '#3b82f6',
  },
  {
    name: 'create-ai-stream-app',
    npm: 'https://www.npmjs.com/package/create-ai-stream-app',
    size: 'CLI',
    badge: '🚀',
    description: 'Scaffold a full working RAIS app in 30 seconds. Picks provider, UI style, and framework.',
    install: 'npx create-ai-stream-app',
    snippet: `npx create-ai-stream-app
# ✔ Project name: my-chat-app
# ✔ Provider: OpenAI / Anthropic / Groq
# ✔ UI: Chat component / Bring your own
# ✔ Install dependencies? Yes

cd my-chat-app && npm run dev`,
    lang: 'bash',
    status: 'stable',
    href: '/quickstart',
    color: '#22c55e',
  },
  {
    name: 'rais-compliance',
    npm: 'https://www.npmjs.com/package/rais-compliance',
    size: 'CLI',
    badge: '✓',
    description: 'Test runner that verifies any server is RAIS v1 compliant. 10 checks, pass/fail report.',
    install: 'npx rais-compliance <endpoint>',
    snippet: `npx rais-compliance http://localhost:3000/api/chat

# ✓ Content-Type is text/event-stream
# ✓ All events are valid JSON
# ✓ Stream ends with done event
# ✓ Abort handling works
# ... 10 checks total
# RAIS v1 Recommended ✓`,
    lang: 'bash',
    status: 'stable',
    href: '/compliance',
    color: '#10b981',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: copied ? '#22c55e' : '#94a3b8', fontSize: 11,
        padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit',
        transition: 'color 0.2s',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

type CardProps = {
  pkg: PackageInfo
  isDark: boolean
  expanded: boolean
  onToggle: () => void
}

function PackageCard({ pkg, isDark, expanded, onToggle }: CardProps) {
  const border = isDark ? '#1e293b' : '#e5e7eb'
  const surface = isDark ? '#0f172a' : '#ffffff'
  const codeBg = isDark ? '#0a0f1e' : '#f1f5f9'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textMuted = isDark ? '#64748b' : '#6b7280'

  const statusColors: Record<string, string> = {
    stable: '#22c55e',
    new: '#7c3aed',
    optional: '#f59e0b',
  }
  const statusLabels: Record<string, string> = {
    stable: 'stable',
    new: 'new v1',
    optional: 'optional',
  }

  return (
    <div style={{
      border: `1px solid ${border}`,
      borderRadius: 12,
      overflow: 'hidden',
      background: surface,
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8,
              background: pkg.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              {pkg.badge}
            </span>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: textPrimary, letterSpacing: '-0.2px' }}>
                {pkg.name}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: 10.5, color: textMuted, background: isDark ? '#1e293b' : '#f1f5f9', padding: '1px 6px', borderRadius: 10 }}>
                  {pkg.size}
                </span>
                <span style={{ fontSize: 10.5, color: statusColors[pkg.status], background: statusColors[pkg.status] + '22', padding: '1px 6px', borderRadius: 10 }}>
                  {statusLabels[pkg.status]}
                </span>
              </div>
            </div>
          </div>
          <a
            href={pkg.npm}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: textMuted, textDecoration: 'none', flexShrink: 0, paddingTop: 2 }}
          >
            npm ↗
          </a>
        </div>
        <p style={{ fontSize: 13, color: textMuted, margin: '10px 0 0', lineHeight: 1.55 }}>
          {pkg.description}
        </p>
      </div>

      {/* Install command */}
      <div style={{
        margin: '12px 16px 0',
        background: codeBg,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 10px',
      }}>
        <code style={{ fontFamily: 'monospace', fontSize: 12, color: pkg.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pkg.install}
        </code>
        <CopyButton text={pkg.install} />
      </div>

      {/* Expand toggle */}
      <button
        onClick={onToggle}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: textMuted, fontSize: 12, padding: '10px 16px',
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ transform: expanded ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
        {expanded ? 'Hide example' : 'Show example'}
      </button>

      {/* Expanded snippet */}
      {expanded && (
        <div style={{ margin: '0 16px 16px', position: 'relative' }}>
          <div style={{
            background: codeBg, borderRadius: 8, padding: '12px 14px',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 8, right: 10 }}>
              <CopyButton text={pkg.snippet} />
            </div>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', lineHeight: 1.6, overflow: 'auto' }}>
              {pkg.snippet}
            </pre>
          </div>
          <a
            href={pkg.href}
            style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}
          >
            Full docs →
          </a>
        </div>
      )}
    </div>
  )
}

export default function PackageGrid() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const isDark = typeof window !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'

  const textMuted = isDark ? '#94a3b8' : '#64748b'
  const border = isDark ? '#1e293b' : '#e5e7eb'

  return (
    <div style={{ margin: '24px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {packages.map((pkg, i) => (
          <PackageCard
            key={pkg.name}
            pkg={pkg}
            isDark={isDark}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>
      <p style={{ fontSize: 12, color: textMuted, marginTop: 16, borderTop: `1px solid ${border}`, paddingTop: 12 }}>
        All packages are MIT licensed. <code style={{ fontFamily: 'monospace' }}>@react-ai-stream/react</code> has no dependency on <code style={{ fontFamily: 'monospace' }}>@react-ai-stream/ui</code> — use the hook with any UI.
      </p>
    </div>
  )
}
