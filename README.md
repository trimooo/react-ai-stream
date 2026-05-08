# react-ai-stream

[![npm](https://img.shields.io/npm/v/@react-ai-stream/react?label=%40react-ai-stream%2Freact)](https://www.npmjs.com/package/@react-ai-stream/react)
[![npm](https://img.shields.io/npm/v/@react-ai-stream/ui?label=%40react-ai-stream%2Fui)](https://www.npmjs.com/package/@react-ai-stream/ui)
[![npm](https://img.shields.io/npm/v/@react-ai-stream/core?label=%40react-ai-stream%2Fcore)](https://www.npmjs.com/package/@react-ai-stream/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/trimooo/react-ai-stream/blob/master/LICENSE)

Stream AI responses into your React app in under a minute.

- **One hook** — `useAIChat` manages messages, loading state, abort, and errors
- **Any backend** — Anthropic, OpenAI, Groq, or your own streaming endpoint
- **Optional UI** — drop-in `<Chat />` component or wire the hook to your own design
- **Event hooks** — `onToken`, `onComplete`, `onError` for side-effects without extra state
- **TypeScript first** — strict types, full DTS, ESM + CJS

```tsx
// 1. npm install @react-ai-stream/react @react-ai-stream/ui
// 2. Add an API route (see Backend Setup below)
// 3. Done.

'use client'
import { useAIChat } from '@react-ai-stream/react'
import { Chat } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

export default function Page() {
  const { messages, sendMessage, loading, stop } = useAIChat({
    endpoint: '/api/chat',
  })

  return (
    <div style={{ height: '80vh' }}>
      <Chat messages={messages} onSend={sendMessage} onStop={stop} loading={loading} />
    </div>
  )
}
```

---

## Why not Vercel AI SDK?

| | react-ai-stream | Vercel AI SDK |
|---|---|---|
| Bundle size | ~12 kB | ~90 kB+ |
| Framework lock-in | None — plain React | Next.js / Vercel optimized |
| Backend required | Optional (direct providers work) | Yes for most features |
| Custom endpoint | First-class | Via adapters |
| Pre-built UI | Yes (`@react-ai-stream/ui`) | No |
| Event hooks | `onToken` / `onComplete` / `onError` | Limited |
| License | MIT | MIT |

react-ai-stream is a good fit when you want a small, portable library with no framework opinions. If you're all-in on Next.js and need RSC streaming or server actions, Vercel AI SDK is worth evaluating.

---

## Installation

```bash
npm install @react-ai-stream/react @react-ai-stream/ui
# or
pnpm add @react-ai-stream/react @react-ai-stream/ui
```

> Peer dependencies: React 18 or 19.

---

## Backend Setup

### Next.js App Router

```ts
// app/api/chat/route.ts
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages,
      stream: true,
    }),
  })

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: object) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''
        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const ev = JSON.parse(line.slice(6))
              if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta')
                send({ type: 'text', text: ev.delta.text })
              else if (ev.type === 'message_stop')
                send({ type: 'done' })
            } catch { /* skip */ }
          }
        }
      }
      send({ type: 'done' })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
```

The SDK expects your endpoint to emit SSE lines in this format:

| Chunk | Meaning |
|---|---|
| `{ "type": "text", "text": "..." }` | Append text to the assistant message |
| `{ "type": "done" }` | Stream is complete |
| `{ "type": "error", "error": "..." }` | Surface an error |

### Express / Node.js

```ts
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(express.json())

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  const client = new Anthropic()
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta')
      send({ type: 'text', text: event.delta.text })
  }

  send({ type: 'done' })
  res.end()
})
```

---

## useAIChat Hook

```tsx
const {
  messages,      // Message[]  — full conversation history
  sendMessage,   // (text: string) => Promise<void>
  loading,       // boolean    — true while streaming
  stop,          // () => void — abort in-flight stream
  error,         // string | null
  clearMessages, // () => void — reset conversation
} = useAIChat(options)
```

### Options

| Option | Type | Description |
|---|---|---|
| `endpoint` | `string` | URL of your streaming API route |
| `headers` | `Record<string, string>` | Extra headers sent with every request |
| `body` | `Record<string, unknown>` | Extra fields merged into every request body |
| `provider` | `'openai' \| 'anthropic'` | Direct provider (no backend needed) |
| `apiKey` | `string` | API key for direct provider |
| `model` | `string` | Model name |
| `baseURL` | `string` | Override base URL (OpenAI-compatible APIs) |
| `maxTokens` | `number` | Max tokens (Anthropic only) |
| `system` | `string` | System prompt (direct providers only) |
| `client` | `AIClient` | Bring your own pre-built client |
| `onToken` | `(token: string) => void` | Called for each streamed text chunk |
| `onComplete` | `(message: Message) => void` | Called when the full response is done |
| `onError` | `(error: Error) => void` | Called on stream or provider errors |

### Event hooks example

```tsx
const chat = useAIChat({
  endpoint: '/api/chat',
  onToken: (token) => {
    // e.g. update a word count in real-time
    setTokenCount((n) => n + 1)
  },
  onComplete: (message) => {
    // e.g. save the final response to a database
    saveToHistory(message)
  },
  onError: (err) => {
    // e.g. report to Sentry
    Sentry.captureException(err)
  },
})
```

### Message shape

```ts
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  createdAt: Date
}
```

---

## Providers

### Custom endpoint (recommended)

```tsx
const chat = useAIChat({ endpoint: '/api/chat' })

// With extra headers or body fields:
const chat = useAIChat({
  endpoint: '/api/chat',
  headers: { 'X-Session-Id': sessionId },
  body: { persona: 'support-agent' },
})
```

### Anthropic direct

```tsx
const chat = useAIChat({
  provider: 'anthropic',
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-6',
  maxTokens: 2048,
  system: 'You are a helpful assistant.',
})
```

### OpenAI direct

```tsx
const chat = useAIChat({
  provider: 'openai',
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  model: 'gpt-4o',
  system: 'You are a helpful assistant.',
})
```

### Groq (OpenAI-compatible)

```tsx
const chat = useAIChat({
  provider: 'openai',
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'llama-3.3-70b-versatile',
})
```

---

## Pre-built UI

### `<Chat />` — all-in-one

```tsx
import { Chat } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

<Chat
  messages={messages}
  onSend={sendMessage}
  onStop={stop}
  loading={loading}
  placeholder="Type here…"
  className="my-chat"
/>
```

### Individual components

```tsx
import { MessageList, ChatInput, MarkdownRenderer } from '@react-ai-stream/ui'

function MyChatUI() {
  const { messages, sendMessage, loading, stop } = useAIChat({ endpoint: '/api/chat' })
  return (
    <div>
      <MessageList messages={messages} loading={loading} />
      <ChatInput onSend={sendMessage} onStop={stop} loading={loading} />
    </div>
  )
}
```

### Theming with CSS variables

```css
:root {
  --ras-bg: #0f172a;
  --ras-bg-user: #6366f1;
  --ras-bg-assistant: #1e293b;
  --ras-text: #f1f5f9;
  --ras-text-user: #ffffff;
  --ras-text-muted: #94a3b8;
  --ras-border: #334155;
  --ras-radius: 16px;
  --ras-font: 'Inter', sans-serif;
  --ras-code-bg: #0d1117;
  --ras-code-text: #c9d1d9;
}
```

| Variable | Default | Controls |
|---|---|---|
| `--ras-bg` | `#ffffff` | Chat container background |
| `--ras-bg-user` | `#2563eb` | User message bubble |
| `--ras-bg-assistant` | `#f3f4f6` | Assistant message bubble |
| `--ras-text` | `#111827` | Base text color |
| `--ras-text-user` | `#ffffff` | Text inside user bubbles |
| `--ras-text-muted` | `#6b7280` | Typing indicator, timestamps |
| `--ras-border` | `#e5e7eb` | Input border, dividers |
| `--ras-radius` | `12px` | Bubble corner radius |
| `--ras-font` | `system-ui, sans-serif` | Font family |
| `--ras-code-bg` | `#1e293b` | Code block background |
| `--ras-code-text` | `#e2e8f0` | Code block text |

### Dark mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ras-bg: #0f172a;
    --ras-bg-user: #6366f1;
    --ras-bg-assistant: #1e293b;
    --ras-text: #f1f5f9;
    --ras-text-muted: #94a3b8;
    --ras-border: #334155;
    --ras-code-bg: #0d1117;
    --ras-code-text: #c9d1d9;
  }
}
```

---

## Customization Recipes

### Custom UI (bypass `<Chat />`)

```tsx
'use client'
import { useState } from 'react'
import { useAIChat } from '@react-ai-stream/react'
import { MarkdownRenderer } from '@react-ai-stream/ui'
import '@react-ai-stream/ui/styles'

export function SupportWidget() {
  const { messages, sendMessage, loading, stop } = useAIChat({ endpoint: '/api/chat' })
  const [input, setInput] = useState('')

  return (
    <div className="widget">
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble--${m.role}`}>
            {m.role === 'assistant'
              ? <MarkdownRenderer content={m.content} />
              : <p>{m.content}</p>}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); setInput('') }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} />
        {loading
          ? <button type="button" onClick={stop}>Stop</button>
          : <button type="submit">Send</button>}
      </form>
    </div>
  )
}
```

### System prompt (server-side, recommended)

```ts
// In your route handler — keeps the prompt private
body: JSON.stringify({
  model: 'claude-sonnet-4-6',
  system: 'You are a friendly support agent for Acme Inc.',
  messages,
  stream: true,
})
```

### Multiple independent chats

Each `useAIChat` call has a completely isolated store — no context needed:

```tsx
const claude = useAIChat({ endpoint: '/api/chat?model=claude' })
const gpt    = useAIChat({ endpoint: '/api/chat?model=gpt' })

// Broadcast the same message to both
function sendToAll(text: string) {
  claude.sendMessage(text)
  gpt.sendMessage(text)
}
```

### Shared client via context

```tsx
import { createAIClient } from '@react-ai-stream/core'
import { AIChatProvider, useAIChat } from '@react-ai-stream/react'

const client = createAIClient({ endpoint: '/api/chat' })

function App() {
  return (
    <AIChatProvider client={client}>
      <MainChat />
    </AIChatProvider>
  )
}

function MainChat() {
  const { messages, sendMessage, loading } = useAIChat({} as any)
  // ...
}
```

### Programmatic control

```tsx
const { sendMessage, clearMessages, stop, messages } = useAIChat({ endpoint: '/api/chat' })

// Send on mount (e.g., welcome message)
useEffect(() => { sendMessage('Say hello briefly.') }, [])

// Reset
function newChat() {
  stop()
  clearMessages()
}

// Read last assistant reply
const lastReply = messages.findLast((m) => m.role === 'assistant')?.content
```

---

## API Reference

### `useAIChat(options)`

Returns `UseAIChatReturn`:

```ts
interface UseAIChatReturn {
  messages:      Message[]
  sendMessage:   (content: string) => Promise<void>
  loading:       boolean
  stop:          () => void
  error:         string | null
  clearMessages: () => void
}
```

### `<Chat />`

| Prop | Type | Required | Description |
|---|---|---|---|
| `messages` | `Message[]` | yes | Message array from `useAIChat` |
| `onSend` | `(text: string) => void` | yes | Called when user submits |
| `onStop` | `() => void` | no | Abort handler — shows Stop button |
| `loading` | `boolean` | no | Enables typing indicator |
| `placeholder` | `string` | no | Input placeholder text |
| `className` | `string` | no | Extra CSS class on root `div` |

### `<MessageList />`

| Prop | Type | Description |
|---|---|---|
| `messages` | `Message[]` | Messages to render |
| `loading` | `boolean` | Show animated typing indicator |
| `className` | `string` | Extra CSS class |

### `<ChatInput />`

| Prop | Type | Description |
|---|---|---|
| `onSend` | `(text: string) => void` | Submit handler |
| `onStop` | `() => void` | Abort handler |
| `loading` | `boolean` | Disable input, show Stop button |
| `placeholder` | `string` | Textarea placeholder |
| `disabled` | `boolean` | Hard-disable the input |

### `<MarkdownRenderer />`

| Prop | Type | Description |
|---|---|---|
| `content` | `string` | Markdown string to render |
| `className` | `string` | Extra CSS class on wrapper |

Renders GitHub-Flavored Markdown with syntax-highlighted code blocks and a copy button on each.

### `createAIClient(options)`

```ts
import { createAIClient } from '@react-ai-stream/core'

const client = createAIClient({ endpoint: '/api/chat' })
const client = createAIClient({ provider: 'openai', apiKey: '...', model: 'gpt-4o' })
const client = createAIClient({ provider: 'anthropic', apiKey: '...', model: 'claude-sonnet-4-6' })
```

Returns `AIClient` — pass to `useAIChat({ client })` or `<AIChatProvider client={...}>`.

---

## License

MIT
