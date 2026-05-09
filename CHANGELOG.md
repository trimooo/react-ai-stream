# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [semantic versioning](https://semver.org/).

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
