# RAIS Ecosystem Registry

A curated list of RAIS Protocol implementations, adapters, tools, and examples. This is the source of truth for ecosystem discovery.

To add your project, open a pull request. See [`IMPLEMENTING.md`](IMPLEMENTING.md) for naming conventions and compliance requirements.

---

## Official implementations

Maintained in the [`react-ai-stream`](https://github.com/trimooo/react-ai-stream) monorepo.

### Frontend clients

| Package | Framework | Language | Compliance | npm |
|---------|-----------|----------|------------|-----|
| `@react-ai-stream/react` | React 18+ | TypeScript | RAIS v1 Recommended | [![npm](https://img.shields.io/npm/v/@react-ai-stream/react)](https://www.npmjs.com/package/@react-ai-stream/react) |
| `@react-ai-stream/vue` | Vue 3 | TypeScript | RAIS v1 Recommended | _(coming soon)_ |

### Server adapters

| Package | Framework | Language | Compliance | Install |
|---------|-----------|----------|------------|---------|
| `@react-ai-stream/express` | Express 4/5 | TypeScript | RAIS v1 Recommended | _(coming soon)_ |
| `rais` | FastAPI / Starlette | Python | RAIS v1 Recommended | `pip install rais` |

### Tooling

| Package | Purpose | Install |
|---------|---------|---------|
| `@react-ai-stream/core` | SSE parser, chunk normalizer, store | `npm i @react-ai-stream/core` |
| `@react-ai-stream/devtools` | Developer panel — token events, timing, tok/s | `npm i -D @react-ai-stream/devtools` |
| `rais-compliance` | Compliance test runner | `npx rais-compliance` |
| `create-ai-stream-app` | Scaffolding CLI | `npx create-ai-stream-app` |

---

## Community implementations

Maintained by their respective authors. Listed here after compliance verification.

### Frontend clients

_Be the first. See [IMPLEMENTING.md](IMPLEMENTING.md)._

| Package | Framework | Language | Compliance | Source |
|---------|-----------|----------|------------|--------|
| _(open)_ | Svelte 5 | TypeScript | — | [good first issue →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Solid.js | TypeScript | — | [good first issue →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Angular | TypeScript | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | React Native / Expo | TypeScript | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |

### Server adapters

| Package | Framework | Language | Compliance | Source |
|---------|-----------|----------|------------|--------|
| _(open)_ | Hono | TypeScript | — | [good first issue →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Fastify | TypeScript | — | [good first issue →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Go net/http | Go | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Axum | Rust | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Rails | Ruby | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Spring Boot | Java | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Laravel | PHP | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |
| _(open)_ | Django | Python | — | [open →](https://github.com/trimooo/react-ai-stream/issues) |

---

## Examples and templates

| Name | Stack | Source |
|------|-------|--------|
| 3-model parallel streaming | Next.js 15 + Groq | [apps/example](https://github.com/trimooo/react-ai-stream/tree/master/apps/example) |
| Vue 3 streaming app | Vue 3 + Vite | [apps/vue-example](https://github.com/trimooo/react-ai-stream/tree/master/apps/vue-example) |
| AI support chat widget | Next.js + React | [docs/templates/ai-support-chat](https://react-ai-stream-docs.vercel.app/templates/ai-support-chat) |
| AI copilot sidebar | Next.js + React | [docs/templates/ai-copilot-sidebar](https://react-ai-stream-docs.vercel.app/templates/ai-copilot-sidebar) |
| Multi-model comparison | Next.js + React | [docs/templates/multi-model](https://react-ai-stream-docs.vercel.app/templates/multi-model) |
| FastAPI + React | FastAPI + React | [docs/templates/fastapi-react](https://react-ai-stream-docs.vercel.app/templates/fastapi-react) |
| Express + React | Express + React | [docs/templates/express-react](https://react-ai-stream-docs.vercel.app/templates/express-react) |

---

## Adding your project

1. Verify compliance: `npx rais-compliance <your-endpoint>`
2. Add a row to the appropriate table above
3. Open a pull request with:
   - Your table row
   - A link to your repository or npm package
   - Your compliance test output (paste or screenshot)

Compliance is verified by maintainers before merge. "Good first issue" rows are reserved for implementations that do not exist yet and where community help is actively wanted.

---

## Compliance tier key

| Badge | Meaning |
|-------|---------|
| ![RAIS v1 Core](https://img.shields.io/badge/RAIS-v1%20Core-3b82f6) | All MUST tests pass |
| ![RAIS v1 Recommended](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e) | All MUST + SHOULD tests pass |
| ![RAIS v1 Full](https://img.shields.io/badge/RAIS-v1%20Full-7c3aed) | Recommended + reconnect support |
