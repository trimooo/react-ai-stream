# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [semantic versioning](https://semver.org/).

---

## [0.1.4] — 2026-05-10

### Added
- `apps/nextjs-basic` — minimal hook-only example app (no `@react-ai-stream/ui` dependency): Next.js 15, edge runtime, Groq backend, plain inline styles. Shows the bare minimum to get streaming working.

### Changed
- npm package descriptions rewritten to lead with the backend-agnostic differentiator:
  - `@react-ai-stream/react`: "Stream AI chat from any backend with a single React hook — Anthropic, OpenAI, Groq, or your own server."
  - `@react-ai-stream/core`: "Backend-agnostic SSE streaming engine and message store for react-ai-stream."
  - `@react-ai-stream/ui`: "Drop-in React chat UI for react-ai-stream — Markdown rendering, syntax highlighting, and full CSS theming."
- `keywords` field added to all three `package.json` files for npm/GitHub search discoverability (`sse`, `streaming`, `backend-agnostic`, `llm`, `anthropic`, `openai`, `groq`, etc.)
- Per-package README openers sharpened to match the new positioning

---

## [0.1.3] — 2026-05-09

### Fixed
- `isAbortError`: removed dead `name === 'DOMException'` check (a DOMException's `.name` is always `'AbortError'`, never literally `'DOMException'`)
- `package.json` exports: moved `types` condition before `import`/`require` in all three packages so TypeScript resolves types correctly
- `MessageList`: added `loading` to scroll `useEffect` deps — typing indicator now scrolls into view when streaming starts
- `useCopyToClipboard`: timer is now cleared on unmount and on rapid re-clicks, preventing stale state updates
- `MarkdownRenderer`: copy button now reads `codeRef.current.textContent` instead of stringifying React element children (fixes `[object Object]` copy when `rehype-highlight` is active)
- All route handlers: `finish_reason === 'length'` (max tokens reached) now closes the stream correctly alongside `stop`
- `DemoChat`: changed `overflow: hidden` → `overflow-y: auto` so users can manually scroll the message pane
- `useAIChat`: client is now reset when `endpoint`, `provider`, `apiKey`, or the context client changes between renders
- `@react-ai-stream/ui` published `dependencies`: removed unused `@react-ai-stream/react` entry (nothing in the package imports it)
- `ChatPanel` (custom-ui example): scroll effect now depends on `messages` array reference, not `messages.length`, so streaming token updates scroll correctly
- Docs `custom-endpoint.mdx` code sample: fixed broken SSE buffer logic (`buf = ''` was set inside the `for..of` loop on first iteration, silently dropping mid-chunk content)
- Docs `anthropic.mdx` code sample: added `controller.close(); return` after `message_stop` so the stream closes promptly
- Docs `/ui` page: was returning 404 — created full UI component reference page
- Docs API Reference (`/api`): was showing blank — created index page
- Docs: link/accent color changed from blue (`hue 243`) to violet (`hue 262`)

### Changed
- `useAIChat` behavior note in docs updated to reflect the new client-reset logic

---

## [0.1.2] — 2026-05-09

### Changed
- Groq models updated to currently active ones: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `meta-llama/llama-4-scout-17b-16e-instruct`
- Redesigned demo site — 3-pane model comparison, hero section, landing page layout

### Fixed
- Turbo `outputs` config now includes `.next/**` for correct Vercel deployment caching

---

## [0.1.1] — 2026-05-09

### Added
- Per-package `README.md` files published to npm
- npm version, license, and bundle size badges in repository README
- `repository`, `homepage`, and `bugs` fields in all `package.json` files

### Fixed
- License field corrected to MIT across all packages
- Workspace dependency versions aligned

---

## [0.1.0] — 2026-05-08

### Added
- `@react-ai-stream/core` — SSE parser, chunk normalizer, message store (Zustand v5), abort utilities
- `@react-ai-stream/react` — `useAIChat` hook, `AIChatProvider` context
- `@react-ai-stream/ui` — `<Chat>`, `<MessageList>`, `<MessageBubble>` components with Markdown + syntax highlighting
- Provider support: Anthropic (Claude), OpenAI, Groq, custom endpoints
- Full TypeScript with strict mode, dual ESM + CJS output via tsup
- 34 unit tests (Vitest) covering SSE parser and chunk normalizer
- `apps/example` — Next.js 15 demo with live 3-model parallel streaming via Groq
- Turborepo monorepo with pnpm workspaces
