# @react-ai-stream/express

Express middleware for [RAIS Protocol](https://github.com/trimooo/react-ai-stream) AI streaming — drop-in SSE handler for any Express app.

[![npm](https://img.shields.io/npm/v/@react-ai-stream/express)](https://www.npmjs.com/package/@react-ai-stream/express)
[![RAIS v1](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e)](https://github.com/trimooo/react-ai-stream)

## Install

```bash
npm install @react-ai-stream/express
```

## Usage

```ts
import express from 'express'
import { raisMiddleware } from '@react-ai-stream/express'

const app = express()
app.use(express.json())

// With a provider (needs API key in env)
app.post('/api/chat', raisMiddleware({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-6',
}))

app.listen(3000)
```

## Custom handler

```ts
app.post('/api/chat', raisMiddleware({
  handler: async function* (messages, signal) {
    yield { type: 'text', text: 'Hello ' }
    yield { type: 'text', text: 'world!' }
    yield { type: 'done' }
  }
}))
```

The `handler` receives the full message history and an `AbortSignal`. Yield RAIS events and the middleware handles all SSE headers, formatting, and abort cleanup.

## Options

| Option | Type | Description |
|---|---|---|
| `handler` | `AsyncGenerator` | Custom streaming handler |
| `provider` | `'openai' \| 'anthropic'` | Use a built-in provider |
| `apiKey` | `string` | Provider API key |
| `model` | `string` | Model name |
| `system` | `string` | System prompt |

## What it handles for you

- Sets `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`
- Formats each yielded object as `data: {...}\n\n`
- Calls `res.end()` after `done` or `error`
- Wires `req.on('close')` to the AbortSignal — cleans up on client disconnect

## Verify compliance

```bash
npx rais-compliance http://localhost:3000/api/chat
# ✓ All 10 tests passed — RAIS v1 Recommended
```

## License

MIT — part of [react-ai-stream](https://github.com/trimooo/react-ai-stream)
