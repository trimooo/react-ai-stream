# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] — 2026-05-08

Initial release of the `react-ai-stream` SDK.

### Packages

- **`@react-ai-stream/core`** `0.1.0` — provider-agnostic streaming engine, SSE parser, Zustand message store, Anthropic + OpenAI built-in providers, custom endpoint client
- **`@react-ai-stream/react`** `0.1.0` — `useAIChat` hook with `onToken` / `onComplete` / `onError` event callbacks, `AIChatProvider` context, `useStableCallback` utility
- **`@react-ai-stream/ui`** `0.1.0` — `<Chat />`, `<MessageList />`, `<ChatInput />`, `<MarkdownRenderer />` with GFM + syntax highlighting, CSS custom property theming

### Features

- Stream tokens from Anthropic, OpenAI, Groq, or any custom SSE endpoint
- Per-instance isolated message stores — multiple `useAIChat` calls never share state
- Abort in-flight streams with `stop()`
- `onToken` fires for every streamed chunk (real-time side-effects without extra state)
- `onComplete` fires once with the final `Message` object (save to DB, analytics, etc.)
- `onError` fires on provider or stream errors
- CSS custom properties (`--ras-*`) for zero-config theming and dark mode
- Full TypeScript types with strict mode, ESM + CJS dual output
