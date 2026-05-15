'use client'

import { useState } from 'react'

interface CodeGenPanelProps {
  url: string
  headers: Record<string, string>
  body: unknown
  isCompliant: boolean
}

type Lang = 'react' | 'vue' | 'nextjs' | 'curl'

const LANG_LABELS: Record<Lang, string> = {
  react: 'React',
  vue: 'Vue 3',
  nextjs: 'Next.js API',
  curl: 'curl',
}

function isDirectProvider(url: string) {
  return url.includes('openai.com') || url.includes('groq.com') ||
    url.includes('anthropic.com') || url.includes('ollama')
}

function genReact(url: string, compliant: boolean) {
  if (!compliant || isDirectProvider(url)) {
    return `// This endpoint is not RAIS-compliant yet.
// Wrap it server-side with raisMiddleware (Express) or
// a Next.js API route, then point useAIChat at your server.

import { useAIChat } from '@react-ai-stream/react'

function Chat() {
  const { messages, isStreaming, sendMessage, abort } = useAIChat({
    endpoint: '/api/chat', // your RAIS-compliant wrapper
  })

  return (
    <div>
      {messages.map((m, i) => <p key={i}>{m.content}</p>)}
      <button onClick={() => sendMessage('Hello!')} disabled={isStreaming}>
        Send
      </button>
      {isStreaming && <button onClick={abort}>Stop</button>}
    </div>
  )
}`
  }
  return `import { useAIChat } from '@react-ai-stream/react'

function Chat() {
  const { messages, isStreaming, sendMessage, abort } = useAIChat({
    endpoint: '${url}',
  })

  return (
    <div>
      {messages.map((m, i) => (
        <p key={i}><strong>{m.role}:</strong> {m.content}</p>
      ))}
      <button onClick={() => sendMessage('Hello!')} disabled={isStreaming}>
        Send
      </button>
      {isStreaming && <button onClick={abort}>Stop</button>}
    </div>
  )
}`
}

function genVue(url: string, compliant: boolean) {
  const endpoint = compliant && !isDirectProvider(url) ? url : '/api/chat'
  return `<script setup lang="ts">
import { useAIChat } from '@react-ai-stream/vue'

const { messages, isStreaming, sendMessage, abort } = useAIChat({
  endpoint: '${endpoint}',
})
<\/script>

<template>
  <div>
    <p v-for="(m, i) in messages" :key="i">
      <strong>{{ m.role }}:</strong> {{ m.content }}
    </p>
    <button @click="sendMessage('Hello!')" :disabled="isStreaming">
      Send
    </button>
    <button v-if="isStreaming" @click="abort">Stop</button>
  </div>
</template>`
}

function genNextjs(url: string, _compliant: boolean) {
  const isGroq = url.includes('groq.com')
  const isAnthropic = url.includes('anthropic.com')
  const isOpenAI = url.includes('openai.com')

  if (isAnthropic) {
    return `// app/api/chat/route.ts
export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages, stream: true }),
  })

  const stream = new ReadableStream({ start(ctrl) {
    // parse Anthropic SSE → emit RAIS events
    // see: react-ai-stream-docs.vercel.app/templates/nextjs-anthropic
  }})

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
}`
  }

  const providerUrl = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : isOpenAI
    ? 'https://api.openai.com/v1/chat/completions'
    : url

  const envKey = isGroq ? 'GROQ_API_KEY' : isOpenAI ? 'OPENAI_API_KEY' : 'API_KEY'
  const model = isGroq ? 'llama-3.3-70b-versatile' : isOpenAI ? 'gpt-4o-mini' : 'your-model'

  return `// app/api/chat/route.ts — RAIS-compatible SSE wrapper
export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const upstream = await fetch('${providerUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${process.env.${envKey}}\`,
    },
    body: JSON.stringify({ model: '${model}', messages, stream: true }),
  })

  const { readable, writable } = new TransformStream()
  const enc = new TextEncoder()
  const writer = writable.getWriter()

  // Translate OpenAI SSE → RAIS events
  ;(async () => {
    const reader = upstream.body!.getReader()
    const dec = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      for (const line of buf.split('\\n')) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const text = JSON.parse(raw)?.choices?.[0]?.delta?.content
          if (text) await writer.write(enc.encode(\`data: \${JSON.stringify({ type: 'text', text })}\\n\\n\`))
        } catch { /* ignore */ }
      }
      buf = buf.split('\\n').pop() ?? ''
    }
    await writer.write(enc.encode('data: {"type":"done"}\\n\\n'))
    await writer.close()
  })()

  return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}`
}

function genCurl(url: string, headers: Record<string, string>, body: unknown) {
  const headerFlags = Object.entries(headers)
    .map(([k, v]) => `  -H '${k}: ${v}' \\`)
    .join('\n')
  return `curl -X POST '${url}' \\
  -H 'Content-Type: application/json' \\
${headerFlags}
  -d '${JSON.stringify(body)}' \\
  --no-buffer`
}

export function CodeGenPanel({ url, headers, body, isCompliant }: CodeGenPanelProps) {
  const [lang, setLang] = useState<Lang>('react')
  const [copied, setCopied] = useState(false)

  if (!url) {
    return <div style={{ color: '#475569', fontSize: 13, padding: '24px 0' }}>Run a stream first to generate integration code.</div>
  }

  const snippets: Record<Lang, string> = {
    react: genReact(url, isCompliant),
    vue: genVue(url, isCompliant),
    nextjs: genNextjs(url, isCompliant),
    curl: genCurl(url, headers, body),
  }

  const code = snippets[lang] ?? ''

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      {isDirectProvider(url) && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 12, color: '#fbbf24' }}>
          This is a direct provider API (non-RAIS). The Next.js snippet shows how to wrap it into a RAIS-compliant endpoint.
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: lang === l ? 'rgba(59,91,255,0.25)' : 'rgba(255,255,255,0.05)',
              color: lang === l ? '#93c5fd' : '#64748b',
            }}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
        <button
          onClick={copy}
          style={{ marginLeft: 'auto', padding: '4px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: copied ? '#22c55e' : '#94a3b8' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 8,
        fontSize: 12, lineHeight: 1.65, color: '#e2e8f0', overflowX: 'auto',
        fontFamily: 'ui-monospace, "Cascadia Code", monospace',
        maxHeight: 420, overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {code}
      </pre>
    </div>
  )
}
