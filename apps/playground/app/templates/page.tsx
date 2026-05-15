'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ── platform definitions ──────────────────────────────────────────────────────

interface Platform {
  id: string
  name: string
  subtitle: string
  icon: string
  color: string
  tags: string[]
  hasProvider: boolean
}

const PLATFORMS: Platform[] = [
  { id: 'nextjs',     name: 'Next.js',     subtitle: 'Full-stack · App Router · React 19',   icon: '▲', color: '#f1f5f9', tags: ['SSR', 'Edge runtime', 'TypeScript'], hasProvider: true  },
  { id: 'vite-react', name: 'Vite + React', subtitle: 'Frontend SPA · hooks-based',           icon: '⚡', color: '#61dafb', tags: ['SPA', 'Fast HMR', 'TypeScript'],     hasProvider: false },
  { id: 'vite-vue',   name: 'Vite + Vue 3', subtitle: 'Frontend SPA · Vue composable',        icon: '🌱', color: '#4ade80', tags: ['SPA', 'Composables', 'TypeScript'],  hasProvider: false },
  { id: 'express',    name: 'Express.js',   subtitle: 'Node.js backend · raisMiddleware',     icon: '🚂', color: '#fbbf24', tags: ['Backend', 'Node.js', 'TypeScript'],  hasProvider: true  },
  { id: 'fastapi',    name: 'FastAPI',       subtitle: 'Python backend · async streaming',    icon: '🐍', color: '#a78bfa', tags: ['Backend', 'Python', 'Async'],        hasProvider: true  },
  { id: 'html',       name: 'Plain HTML',   subtitle: 'Zero build step · single file',        icon: '📄', color: '#94a3b8', tags: ['No build', 'Vanilla JS', 'Simple'],  hasProvider: false },
]

const PROVIDERS = [
  { id: 'groq',      name: 'Groq',      subtitle: 'Llama 3.3 — free tier',  color: '#f59e0b' },
  { id: 'openai',    name: 'OpenAI',    subtitle: 'GPT-4o mini',             color: '#10b981' },
  { id: 'anthropic', name: 'Anthropic', subtitle: 'Claude Haiku',            color: '#e879f9' },
  { id: 'custom',    name: 'Custom',    subtitle: 'Bring your own handler',  color: '#64748b' },
]

// ── code snippets ─────────────────────────────────────────────────────────────

const SNIPPETS: Record<string, Record<string, { file: string; code: string }>> = {
  nextjs: {
    groq: {
      file: 'app/api/chat/route.ts',
      code: `import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface Message { role: string; content: string }

function chunk(data: object) {
  return new TextEncoder().encode(\`data: \${JSON.stringify(data)}\n\n\`)
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: Message[] }
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${apiKey}\` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, stream: true }),
    signal: req.signal,
  })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const parts = buf.split('\\n\\n')
        buf = parts.pop() ?? ''
        for (const part of parts) {
          const line = part.split('\\n').find(l => l.startsWith('data: '))
          if (!line) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { controller.enqueue(chunk({ type: 'done' })); controller.close(); return }
          const parsed = JSON.parse(data)
          const text = parsed.choices?.[0]?.delta?.content
          if (text) controller.enqueue(chunk({ type: 'text', text }))
        }
      }
      controller.enqueue(chunk({ type: 'done' }))
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}`,
    },
    openai: {
      file: 'app/api/chat/route.ts',
      code: `// Same as Groq but with OpenAI endpoint
// model: 'gpt-4o-mini'
// url: 'https://api.openai.com/v1/chat/completions'
// apiKey: process.env.OPENAI_API_KEY`,
    },
    anthropic: {
      file: 'app/api/chat/route.ts',
      code: `import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'edge'

function chunk(data: object) {
  return new TextEncoder().encode(\`data: \${JSON.stringify(data)}\n\n\`)
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const s = await client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages,
      })
      for await (const text of s.text_stream) {
        controller.enqueue(chunk({ type: 'text', text }))
      }
      controller.enqueue(chunk({ type: 'done' }))
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}`,
    },
  },

  'vite-react': {
    none: {
      file: 'src/App.tsx',
      code: `import { useState } from 'react'
import { useAIChat } from '@react-ai-stream/react'

const ENDPOINT = import.meta.env.VITE_API_URL ?? '/api/chat'

export default function App() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, loading, stop } = useAIChat({ endpoint: ENDPOINT })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      <div>
        {messages.map(m => (
          <div key={m.id} style={{
            padding: '8px 14px', marginBottom: 8, borderRadius: 10,
            background: m.role === 'user' ? '#3B5BFF' : '#f1f5f9',
            color: m.role === 'user' ? '#fff' : '#0f172a',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Type a message…" disabled={loading}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
        {loading
          ? <button type="button" onClick={stop}>Stop</button>
          : <button type="submit" disabled={!input.trim()}>Send</button>}
      </form>
    </div>
  )
}`,
    },
  },

  'vite-vue': {
    none: {
      file: 'src/App.vue',
      code: `<script setup lang="ts">
import { ref } from 'vue'
import { useAIChat } from '@react-ai-stream/vue'

const ENDPOINT = import.meta.env.VITE_API_URL ?? '/api/chat'
const input = ref('')
const { messages, loading, sendMessage, stop } = useAIChat({ endpoint: ENDPOINT })

function handleSubmit() {
  const text = input.value.trim()
  if (!text || loading.value) return
  input.value = ''
  sendMessage(text)
}
</script>

<template>
  <div class="chat">
    <div v-for="m in messages" :key="m.id"
      :class="['bubble', m.role === 'user' ? 'user' : 'ai']">
      {{ m.content }}
    </div>
    <form @submit.prevent="handleSubmit" class="form">
      <input v-model="input" placeholder="Type a message…" :disabled="loading" />
      <button v-if="loading" type="button" @click="stop">Stop</button>
      <button v-else type="submit" :disabled="!input.trim()">Send</button>
    </form>
  </div>
</template>`,
    },
  },

  express: {
    groq: {
      file: 'server.ts',
      code: `import 'dotenv/config'
import express from 'express'
import { raisMiddleware } from '@react-ai-stream/express'

const app = express()
app.use(express.json())

// Allow any frontend origin during development
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})
app.options('*' as string, (_, res) => { res.sendStatus(200) })

// Groq is OpenAI-compatible — pass baseURL
app.post('/api/chat', raisMiddleware({
  provider: 'openai',
  apiKey: process.env.GROQ_API_KEY ?? '',
  model: 'llama-3.3-70b-versatile',
  baseURL: 'https://api.groq.com/openai/v1',
}))

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => console.log(\`RAIS server → http://localhost:\${PORT}\`))`,
    },
    custom: {
      file: 'server.ts',
      code: `import 'dotenv/config'
import express from 'express'
import { raisMiddleware } from '@react-ai-stream/express'
import type { Message, StreamChunk } from '@react-ai-stream/express'

const app = express()
app.use(express.json())
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})
app.options('*' as string, (_, res) => { res.sendStatus(200) })

// Wire your own AI model here
async function* handler(messages: Message[], signal: AbortSignal): AsyncIterable<StreamChunk> {
  const last = messages.at(-1)?.content ?? ''
  for (const word of \`Echo: \${last}\`.split(' ')) {
    if (signal.aborted) return
    yield { type: 'text', text: word + ' ' }
    await new Promise<void>(r => setTimeout(r, 50))
  }
  yield { type: 'done' }
}

app.post('/api/chat', raisMiddleware({ handler }))
app.listen(3001, () => console.log('RAIS server → http://localhost:3001'))`,
    },
  },

  fastapi: {
    groq: {
      file: 'main.py',
      code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel
import asyncio, json, os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = AsyncOpenAI(
    api_key=os.environ["GROQ_API_KEY"],
    base_url="https://api.groq.com/openai/v1",
)

class ChatRequest(BaseModel):
    messages: list[dict]

async def stream_groq(messages):
    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        stream=True,
    )
    async for event in stream:
        text = event.choices[0].delta.content
        if text:
            yield f"data: {json.dumps({'type': 'text', 'text': text})}\\n\\n"
            await asyncio.sleep(0)
    yield f"data: {json.dumps({'type': 'done'})}\\n\\n"

@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        stream_groq(req.messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )`,
    },
    openai: {
      file: 'main.py',
      code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from rais import stream_response
from pydantic import BaseModel
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel):
    messages: list[dict]

@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        stream_response(req.messages, provider="openai",
                        api_key=os.environ.get("OPENAI_API_KEY"),
                        model="gpt-4o-mini"),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )`,
    },
  },

  html: {
    none: {
      file: 'index.html (key script)',
      code: `const ENDPOINT = 'http://localhost:3001/api/chat'
const messages = []

async function sendMessage(content) {
  messages.push({ role: 'user', content })

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = '', accumulated = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const parts = buf.split('\\n\\n')
    buf = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.split('\\n').find(l => l.startsWith('data: '))
      if (!line) continue
      const ev = JSON.parse(line.slice(6))
      if (ev.type === 'text') {
        accumulated += ev.text
        // update UI with accumulated
      }
    }
  }
  messages.push({ role: 'assistant', content: accumulated })
}`,
    },
  },
}

// ── copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} style={{ padding: '4px 12px', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 6, fontSize: 11, color: copied ? '#4ade80' : '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// ── install command ───────────────────────────────────────────────────────────

function InstallCmd({ platform, provider }: { platform: string; provider: string }) {
  const cmd = `npx create-ai-stream-app`
  return (
    <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(59,91,255,0.08)', border: '1px solid rgba(59,91,255,0.2)', borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quick Start</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <code style={{ flex: 1, fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#93c5fd', background: 'rgba(59,91,255,0.1)', padding: '8px 12px', borderRadius: 6 }}>
          {cmd}
        </code>
        <CopyButton text={cmd} />
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: '#475569' }}>
        The interactive CLI will guide you through platform + provider selection → scaffold a working project in seconds.
      </p>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

function TemplatesInner() {
  const searchParams = useSearchParams()
  const [selectedPlatform, setSelectedPlatform] = useState<string>('nextjs')
  const [selectedProvider, setSelectedProvider] = useState<string>('groq')

  useEffect(() => {
    const p = searchParams.get('provider')
    if (p && PROVIDERS.some(pr => pr.id === p)) setSelectedProvider(p)
  }, [])

  const platform = PLATFORMS.find(p => p.id === selectedPlatform)!
  const providerId = platform.hasProvider ? selectedProvider : 'none'
  const snippet = SNIPPETS[selectedPlatform]?.[providerId] ?? SNIPPETS[selectedPlatform]?.['none'] ?? SNIPPETS[selectedPlatform]?.[Object.keys(SNIPPETS[selectedPlatform] ?? {})[0] ?? '']

  return (
    <main style={{ maxWidth: 1300, margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#f1f5f9' }}>
          Templates
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Ready-to-run starters for every stack. Pick a platform, pick a provider, get code.
        </p>
      </div>

      {/* Platform selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Platform</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedPlatform(p.id); if (!p.hasProvider) setSelectedProvider('none') }}
              style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: 10, border: `1px solid ${selectedPlatform === p.id ? p.color + '55' : 'rgba(255,255,255,0.07)'}`,
                background: selectedPlatform === p.id ? `${p.color}10` : 'rgba(255,255,255,0.025)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: selectedPlatform === p.id ? p.color : '#f1f5f9', marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>{p.subtitle}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {p.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider selector (only for platforms that have one) */}
      {platform.hasProvider && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>LLM Provider</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROVIDERS.filter(p => !(selectedPlatform === 'fastapi' && p.id === 'custom')).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${selectedProvider === p.id ? p.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  background: selectedProvider === p.id ? `${p.color}15` : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedProvider === p.id ? p.color : '#94a3b8' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{p.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Code preview */}
      {snippet && (
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: platform.color }} />
              <code style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>{snippet.file}</code>
            </div>
            <CopyButton text={snippet.code} />
          </div>
          <pre style={{
            margin: 0, padding: '18px 20px', background: 'rgba(0,0,0,0.35)', borderRadius: 8,
            fontSize: 12, lineHeight: 1.7, color: '#e2e8f0', overflowX: 'auto',
            fontFamily: 'ui-monospace, "Cascadia Code", monospace', whiteSpace: 'pre',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <code>{snippet.code}</code>
          </pre>

          <InstallCmd platform={selectedPlatform} provider={selectedProvider} />
        </div>
      )}

      {/* Ecosystem overview */}
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {[
          { title: '@react-ai-stream/react', desc: 'useAIChat hook for React 18/19 + Next.js', color: '#61dafb' },
          { title: '@react-ai-stream/vue', desc: 'useAIChat composable for Vue 3', color: '#4ade80' },
          { title: '@react-ai-stream/ui', desc: 'Drop-in <Chat> component with streaming UI', color: '#3B5BFF' },
          { title: '@react-ai-stream/express', desc: 'raisMiddleware — one line for any Express backend', color: '#fbbf24' },
          { title: 'rais (Python)', desc: 'stream_response() for FastAPI / Starlette', color: '#a78bfa' },
          { title: 'create-ai-stream-app', desc: 'npx scaffolder — 6 platforms, 3 providers', color: '#f1f5f9' },
        ].map(pkg => (
          <a key={pkg.title} href="https://react-ai-stream-docs.vercel.app" target="_blank" rel="noreferrer"
            style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}>
            <code style={{ fontSize: 12, color: pkg.color, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{pkg.title}</code>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#475569' }}>{pkg.desc}</p>
          </a>
        ))}
      </div>
    </main>
  )
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading…</div>}>
      <TemplatesInner />
    </Suspense>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: 22,
}
