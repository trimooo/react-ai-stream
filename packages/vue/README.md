# @react-ai-stream/vue

Vue 3 composable for [RAIS Protocol](https://github.com/trimooo/react-ai-stream) AI streaming — the `useAIChat` hook for Vue.

[![npm](https://img.shields.io/npm/v/@react-ai-stream/vue)](https://www.npmjs.com/package/@react-ai-stream/vue)
[![RAIS v1](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e)](https://github.com/trimooo/react-ai-stream)

## Install

```bash
npm install @react-ai-stream/vue
```

## Usage

```vue
<script setup lang="ts">
import { useAIChat } from '@react-ai-stream/vue'

const { messages, sendMessage, loading, stop, error } = useAIChat({
  endpoint: '/api/chat',
})
</script>

<template>
  <div v-for="msg in messages" :key="msg.id">
    <strong>{{ msg.role }}</strong>: {{ msg.content }}
  </div>

  <input @keydown.enter="e => sendMessage(e.target.value)" placeholder="Send a message" />
  <button v-if="loading" @click="stop">Stop</button>
</template>
```

## Options

| Option | Type | Description |
|---|---|---|
| `endpoint` | `string` | URL of your RAIS-compliant streaming route |
| `client` | `AIClient` | Bring your own pre-built client |
| `onToken` | `(token: string) => void` | Called for each streamed text chunk |
| `onComplete` | `(message: Message) => void` | Called when the full response is done |
| `onError` | `(error: Error) => void` | Called on stream errors |

## Return values

| Value | Type | Description |
|---|---|---|
| `messages` | `ShallowRef<Message[]>` | Full conversation history |
| `sendMessage` | `(text: string) => Promise<void>` | Send a message and start streaming |
| `loading` | `ShallowRef<boolean>` | True while streaming |
| `stop` | `() => void` | Abort the in-flight stream |
| `error` | `ShallowRef<string \| null>` | Last error message |
| `clearMessages` | `() => void` | Reset conversation |

All return values are Vue `shallowRef`s — fully reactive. The stream is automatically aborted on `onUnmounted`.

## Backend

Point `endpoint` at any RAIS-compliant server. Works with:

- `@react-ai-stream/express` — Express middleware
- `rais-server` — zero-config reference server
- Next.js App Router API routes
- FastAPI with the Python `rais` package

```bash
# Verify your backend is RAIS-compliant
npx rais-compliance http://localhost:3000/api/chat
```

## License

MIT — part of [react-ai-stream](https://github.com/trimooo/react-ai-stream)
