# @react-ai-stream/ui

[![npm](https://img.shields.io/npm/v/@react-ai-stream/ui)](https://www.npmjs.com/package/@react-ai-stream/ui)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/trimooo/react-ai-stream/blob/master/LICENSE)

Pre-built UI components for the `react-ai-stream` SDK — drop-in chat interface with Markdown rendering, syntax highlighting, and full CSS theming.

## Install

```bash
npm install @react-ai-stream/react @react-ai-stream/ui
```

> Peer dependencies: React 18 or 19.

## Quick start

```tsx
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

## Components

| Component | Description |
|---|---|
| `<Chat />` | All-in-one chat UI (messages + input) |
| `<MessageList />` | Scrollable message list with typing indicator |
| `<ChatInput />` | Textarea + send/stop button |
| `<MarkdownRenderer />` | GFM Markdown with syntax highlighting and copy button |

## Theming

Override CSS variables to match your design:

```css
:root {
  --ras-bg: #0f172a;
  --ras-bg-user: #6366f1;
  --ras-bg-assistant: #1e293b;
  --ras-text: #f1f5f9;
  --ras-radius: 16px;
}
```

## Documentation

Full docs, theming reference, and customization recipes: [github.com/trimooo/react-ai-stream](https://github.com/trimooo/react-ai-stream)
