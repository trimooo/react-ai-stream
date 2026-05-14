# RAIS Protocol Compatibility Matrix

This document tracks known RAIS v1 implementations across languages, frameworks, and transports.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Supported |
| ⚠️ | Partial / experimental |
| ❌ | Not supported |
| 🔜 | Planned |
| — | Not applicable |

---

## Server implementations

| Language | Framework | Package | SSE | WebSocket | Abort | Status |
|----------|-----------|---------|-----|-----------|-------|--------|
| TypeScript | Express 4/5 | `@react-ai-stream/express` | ✅ | — | ✅ | Stable |
| TypeScript | Next.js (App Router) | Built-in route | ✅ | — | ✅ | Stable |
| Python | FastAPI / Starlette | `rais` | ✅ | — | ✅ | Stable |
| Python | Flask | `rais` | ✅ | — | ⚠️ | Stable |
| TypeScript | Hono | Community | 🔜 | — | 🔜 | Planned |
| Go | net/http | Community | 🔜 | — | 🔜 | Planned |
| Ruby | Rails | Community | 🔜 | — | 🔜 | Planned |
| Rust | Axum | Community | 🔜 | — | 🔜 | Planned |
| Java | Spring Boot | Community | 🔜 | — | 🔜 | Planned |
| PHP | Laravel | Community | 🔜 | — | 🔜 | Planned |

---

## Client implementations

| Language | Framework | Package | SSE | WebSocket | Abort | Status |
|----------|-----------|---------|-----|-----------|-------|--------|
| TypeScript | React 18+ | `@react-ai-stream/react` | ✅ | ✅ | ✅ | Stable |
| TypeScript | Vue 3 | `@react-ai-stream/vue` | ✅ | 🔜 | ✅ | Stable |
| TypeScript | Svelte | Community | 🔜 | — | 🔜 | Planned |
| TypeScript | Solid.js | Community | 🔜 | — | 🔜 | Planned |
| TypeScript | Angular | Community | 🔜 | — | 🔜 | Planned |
| TypeScript | React Native / Expo | Core (polyfill needed) | ⚠️ | — | ⚠️ | Planned |
| Swift | SwiftUI | Community | 🔜 | — | 🔜 | Planned |
| Kotlin | Android | Community | 🔜 | — | 🔜 | Planned |
| Python | — | `rais` client (planned) | 🔜 | — | 🔜 | Planned |

---

## LLM provider support (via server adapters)

| Provider | `@react-ai-stream/express` | `rais` (Python) | Direct (React hook) |
|----------|---------------------------|-----------------|---------------------|
| OpenAI | ✅ | ✅ | ✅ |
| Anthropic | ✅ | ✅ | ✅ |
| Groq | ✅ | ✅ | ✅ (OpenAI-compatible) |
| Azure OpenAI | ⚠️ (baseURL override) | ⚠️ | ⚠️ |
| Mistral | ⚠️ (OpenAI-compatible) | ⚠️ | ⚠️ |
| Ollama (local) | ⚠️ | ⚠️ | ⚠️ |
| Google Gemini | 🔜 | 🔜 | ❌ |
| AWS Bedrock | 🔜 | 🔜 | ❌ |
| Custom / self-hosted | ✅ (custom handler) | ✅ (custom generator) | ✅ (custom endpoint) |

---

## Transport support by client

| Client | SSE | WebSocket | Notes |
|--------|-----|-----------|-------|
| `@react-ai-stream/react` | ✅ | ✅ | `transport: 'ws'` option |
| `@react-ai-stream/vue` | ✅ | 🔜 | Planned for v0.2 |
| Curl | ✅ | ❌ | `curl -N -X POST ...` |
| Python `httpx` | ✅ | ✅ | Manual parsing |
| Browser `EventSource` | ⚠️ | ❌ | GET only; use `fetch` for POST |
| Browser `fetch` | ✅ | — | Recommended for RAIS SSE |
| Browser `WebSocket` | — | ✅ | For WS transport |

---

## Contributing

To add your implementation to this matrix, open a pull request with:

1. The row to add / update
2. A link to the implementation (GitHub repo or npm package)
3. Evidence of compliance (`npx rais-compliance <endpoint>` output, or test results)

Implementations labeled "Community" are not maintained in this repository — links and status are community-reported.
