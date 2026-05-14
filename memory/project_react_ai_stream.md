---
name: react-ai-stream SDK project
description: Monorepo SDK evolving into universal AI streaming infrastructure — RAIS protocol, CLI scaffolding, cross-framework adapters
type: project
originSessionId: 5ec72be6-0555-4e45-9768-7a6b6f694e4a
---
Monorepo SDK: pnpm + Turborepo, packages/core + react + ui + create-ai-stream-app, apps/example (Next.js 15 demo), apps/docs (Nextra v2 docs site).

Current version: **0.1.4** — published to npm for core/react/ui packages.

**Strategic direction (as of 2026-05-14):** Positioned as "Universal AI streaming infrastructure." The wire protocol is formally named **RAIS (React AI Stream) Protocol v1** with a standalone spec in `rais-spec/`. Ecosystem: 8 packages across React, Vue, Express, Python, DevTools, and compliance tooling.

**Why:** Backend-agnostic AI streaming. Three-event SSE protocol (text/done/error). The React hook never knows which LLM produced the stream. Protocols outlive libraries — RAIS is the standard, react-ai-stream is the reference implementation.

**How to apply:** Project is in ecosystem-expansion + standardization phase. Protocol is RAIS. New packages land in this monorepo. README and docs homepage say "Universal AI streaming infrastructure." Protect simplicity while expanding reach.

## Architecture

- `packages/core` — SSE parser, chunk normalizer, Zustand `createStore` (vanilla), abort utils. No React dep.
- `packages/react` — `useAIChat` hook (uses `useSyncExternalStore` + Zustand store per hook instance), `AIChatProvider` context
- `packages/ui` — `<Chat>`, `<MessageList>`, `<MarkdownRenderer>` (rehype-highlight), optional dependency on react package
- `packages/create-ai-stream-app` — CLI scaffolding tool, published as `create-ai-stream-app` on npm. `npx create-ai-stream-app` prompts for provider/UI and generates a working Next.js app. 4 provider templates (openai/anthropic/groq/custom) + 2 UI overlays (tailwind/hooks). Single CJS bundle via tsup with `@clack/prompts` bundled.
- `packages/express/` → `@react-ai-stream/express` — `raisMiddleware(options)` factory. Options: `{provider, apiKey, model}` or `{handler: async function*(messages, signal)}`. Peer dep on express ^4||^5.
- `packages/vue/` → `@react-ai-stream/vue` — `useAIChat` Vue 3 composable. Uses `shallowRef` + `onUnmounted`. Same API surface as React hook (values are `ShallowRef`).
- `packages/python-rais/` → `rais` on PyPI — `stream_response(messages, provider=..., ...)` async generator. Optional deps: `rais[openai]`, `rais[anthropic]`, `rais[all]`.
- `packages/devtools/` → `@react-ai-stream/devtools` — floating `<RAISDevTools />` panel + `useAIChat` telemetry wrapper. Uses `useSyncExternalStore` on a shared `devStore` (singleton). Sessions tracked by chat-N ID with token count, elapsed, tok/s. Log shows SEND/DONE/ERR/STOP events (last 200). Zero production cost when not mounted.
- `packages/rais-compliance/` → `rais-compliance` on npm — `npx rais-compliance <endpoint>` compliance test runner CLI. Tests RAIS v1 MUST/SHOULD requirements and reports pass/fail/warn. Single CJS bundle via tsup.
- `apps/example` — Next.js 15 App Router demo, 3-model parallel streaming via Groq
- `apps/vue-example/` — Vite + Vue 3 demo app consuming `@react-ai-stream/vue`
- `apps/docs` — Nextra v2 (Next.js 14 Pages Router), deployed to Vercel

## Key technical decisions

- Zustand `createStore` (not `create`) so store lives outside React tree — decouples mutation rate from render rate during streaming
- `useSyncExternalStore` for React subscription — one isolated store per `useAIChat` call, no shared context needed
- `pages/api/` conflict: API reference docs moved to `pages/reference/` (Next.js reserves `pages/api/` for route handlers)
- Plausible Analytics wired on both demo and docs sites — user must configure account at plausible.io for data to flow
- pnpm `--frozen-lockfile` in CI — any `package.json` version change requires `pnpm install` + committing lockfile before push
- `create-ai-stream-app` uses `declare const __dirname: string` (tsup injects this for CJS) — do NOT use `import.meta.url` in that package
- Same CJS/`declare const __dirname` pattern applies to `rais-compliance` package

## Spec directory (rais-spec/)

- `rais-spec/README.md` — what RAIS is, why standalone spec, reference implementations
- `rais-spec/SPEC.md` — RFC-style normative specification (MUST/SHOULD/MUST NOT language, transport, events, abort, reconnect, security)
- `rais-spec/COMPLIANCE.md` — pass/fail checklist for servers and clients, certification levels
- `rais-spec/COMPATIBILITY.md` — language/framework implementation matrix
- `rais-spec/CHANGELOG.md` — protocol version history, planned v1.1 and v2 changes

## Docs additions (2026-05-14)

- `apps/docs/pages/spec.mdx` — RAIS Protocol v1 formal specification (transport, event types, abort, reconnect, reserved events, compliance checklist)
- `apps/docs/pages/templates/` — 7 copy-paste templates: nextjs-openai, nextjs-anthropic, express-react, fastapi-react, multi-model, ai-support-chat, ai-copilot-sidebar
- `apps/docs/pages/adapters/` — Express, Vue, Python adapter docs (4 MDX files)
- `apps/docs/pages/devtools.mdx` — DevTools setup guide and API reference
- `apps/docs/pages/compliance.mdx` — `npx rais-compliance` usage, output format, certification levels
- `apps/docs/pages/_meta.json` — includes Templates, Adapters, RAIS Protocol, DevTools, Compliance sections
- `apps/docs/pages/index.mdx` — repositioned to "Universal AI streaming infrastructure"

## Phase 3 additions (2026-05-14)

- `packages/devtools/` → `@react-ai-stream/devtools` — (see above)
- `packages/core/src/streaming/ws-parser.ts` — `streamWebSocket(url, messages, signal, extraBody)` async generator. Same `AsyncIterable<StreamChunk>` interface as SSE.
- `packages/core/src/types.ts` — added `transport?: 'sse' | 'ws'` to `CustomEndpointOptions` (backward compatible, defaults to 'sse')
- `packages/core/src/providers/custom.ts` — dispatches to `streamWebSocket` when `transport === 'ws'`

## Phase 4 additions (2026-05-14)

- `README.md` — full rewrite: "Universal AI streaming infrastructure" positioning, ecosystem table (all 8 packages), RAIS wire format reference, updated comparison table, RAIS v1 Recommended badge, "Official" implementation branding, stability pledge + RFC references
- `rais-spec/` — standalone protocol specification directory (see above)
- `packages/rais-compliance/` — compliance test runner CLI; outputs badge markdown after passing
- `apps/docs/pages/index.mdx` — repositioned hero + updated ecosystem section

## Phase 5 additions (2026-05-14) — governance + legitimacy

- `rais-spec/STABILITY.md` — formal v1 stability guarantee: backward compat is permanent, additive-only evolution, 3×3 version compatibility matrix, scope boundary (protocol vs SDK semver)
- `rais-spec/PRINCIPLES.md` — 8 design principles with rationale + tension analysis: additive-first, transport-agnostic, human-readable, graceful degradation, implementation-light, framework-independent, abort propagation mandatory, clarity over completeness
- `rais-spec/PHILOSOPHY.md` — ecosystem manifesto: why provider lock-in is dangerous, why transport standards matter, why frameworks shouldn't own protocols, why additive evolution matters, the outcome we're working toward
- `rais-spec/IMPLEMENTING.md` — guide for third-party implementers: MVS (server/client in 30-50 lines), framework adapter structure, compliance claiming process, naming conventions
- `rais-spec/ECOSYSTEM.md` — ecosystem registry: official implementations, community implementations (with "good first issue" open slots for Svelte/Solid/Hono/Go/Rust/Rails/Java/PHP), examples, compliance tier key
- `rfcs/README.md` — RFC process: Draft→Review→Accepted/Rejected/Withdrawn, what requires an RFC, active RFC index
- `rfcs/0000-template.md` — RFC template with required sections
- `rfcs/RAIS-RFC-0001-tool-calls.md` — Draft: tool_call + tool_result events, parallel tool calls, v1 backward compat, 3 open questions
- `rfcs/RAIS-RFC-0002-metadata.md` — Draft: metadata event (or field on done), targets v1.1; surfaces "separate event vs field on done" design question
- `rfcs/RAIS-RFC-0003-reasoning.md` — Draft: reasoning/thinking token events for extended-thinking models; SDK impact (onReasoning callback); security considerations
- `apps/docs/pages/why-rais.mdx` — philosophy page in docs site
- `apps/docs/pages/_meta.json` — added "Why RAIS Exists" nav entry

## Roadmap (planned)

- Enterprise reliability in `@react-ai-stream/react`: retry with exponential backoff (zero-token streams only), streaming timeout, `onRetry` callback
- React Native audit (EventSource/fetch polyfill path for Expo)
- Svelte adapter (`@react-ai-stream/svelte`) — good-first-issue
- Solid.js adapter (`@react-ai-stream/solid`) — good-first-issue
- Benchmarks docs page (bundle size, re-render count, token throughput vs Vercel AI SDK)
- Interactive playground (`play.react-ai-stream.dev`)
- RAIS Protocol v2 design (additive: tool_call, metadata, reasoning events)
- Persistence layer (`@react-ai-stream/persist` — localStorage/IndexedDB/Supabase adapters)

## Deployment

- Demo: https://react-ai-stream-example.vercel.app
- Docs: https://react-ai-stream-docs.vercel.app
- npm: @react-ai-stream/core, @react-ai-stream/react, @react-ai-stream/ui, create-ai-stream-app (CLI)

## Scope boundary (protect aggressively)

This library is about streaming AI responses. NOT: agents, RAG, orchestration, memory, tool use, workflows.

## CI/CD

`.github/workflows/ci.yml` — runs tests, typecheck, build on packages only (no API keys needed).
