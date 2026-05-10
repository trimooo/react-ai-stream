# @react-ai-stream/react

[![npm](https://img.shields.io/npm/v/@react-ai-stream/react)](https://www.npmjs.com/package/@react-ai-stream/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/trimooo/react-ai-stream/blob/master/LICENSE)

**Stream AI chat from any backend with a single React hook.** Works with Anthropic, OpenAI, Groq, FastAPI, Go, Rails, or any server that speaks HTTP + SSE.

## Install

```bash
npm install @react-ai-stream/react
```

> Peer dependencies: React 18 or 19.

## Quick start

```tsx
'use client'
import { useAIChat } from '@react-ai-stream/react'

export default function Page() {
  const { messages, sendMessage, loading, stop, error } = useAIChat({
    endpoint: '/api/chat',
  })

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id}><strong>{m.role}:</strong> {m.content}</p>
      ))}
      <button onClick={() => sendMessage('Hello!')} disabled={loading}>Send</button>
      {loading && <button onClick={stop}>Stop</button>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

## Event hooks

```tsx
const chat = useAIChat({
  endpoint: '/api/chat',
  onToken: (token) => console.log('chunk:', token),
  onComplete: (message) => saveToDatabase(message),
  onError: (err) => Sentry.captureException(err),
})
```

## Hook return values

| Value | Type | Description |
|---|---|---|
| `messages` | `Message[]` | Full conversation history |
| `sendMessage` | `(text: string) => Promise<void>` | Send a message |
| `loading` | `boolean` | True while streaming |
| `stop` | `() => void` | Abort in-flight stream |
| `error` | `string \| null` | Last error message |
| `clearMessages` | `() => void` | Reset conversation |

## Documentation

Full docs, backend setup, and provider options: [github.com/trimooo/react-ai-stream](https://github.com/trimooo/react-ai-stream)
