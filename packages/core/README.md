# @react-ai-stream/core

[![npm](https://img.shields.io/npm/v/@react-ai-stream/core)](https://www.npmjs.com/package/@react-ai-stream/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/trimooo/react-ai-stream/blob/master/LICENSE)

Provider-agnostic streaming engine for the `react-ai-stream` SDK.

This package contains the core primitives — SSE parser, message store, and built-in providers for Anthropic, OpenAI, and custom endpoints. You don't need to install this directly unless you're building your own integration.

## Install

```bash
npm install @react-ai-stream/core
```

## Included

- `createAIClient(options)` — create a streaming client for any provider
- `AnthropicProvider` / `OpenAIProvider` / `CustomProvider` — provider implementations
- `createMessageStore()` — Zustand-based message store
- `parseSSE` / `normalizeOpenAIChunk` / `normalizeAnthropicChunk` — streaming utilities
- Full TypeScript types: `Message`, `StreamChunk`, `AIClient`, `UseAIChatOptions`, `UseAIChatCallbacks`

## Documentation

Full docs and examples: [github.com/trimooo/react-ai-stream](https://github.com/trimooo/react-ai-stream)
