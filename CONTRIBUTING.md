# Contributing to react-ai-stream

This monorepo contains both the **RAIS Protocol** (a wire standard) and its **official implementations** (React, Vue, Express, Python). Contributions to either are welcome and follow different paths.

---

## Before you start

- **Check existing issues and PRs** — your idea may already be in progress.
- **For significant changes** (new package, API additions, protocol changes), open an issue first.
- **Scope**: RAIS and this monorepo are about streaming AI responses, not about agents, RAG, orchestration, memory, or tool use. PRs that expand the scope without an accepted RFC will be declined.

---

## Ways to contribute

### 1. Build a community implementation (highest impact)

The most valuable contributions are **independent RAIS implementations** in languages and frameworks not yet covered. These prove the spec is unambiguous and make the protocol real.

**Most wanted:**
- Svelte 5 client composable
- Solid.js client
- Hono server middleware
- Go `net/http` server
- Rust (Axum) server
- React Native / Expo client
- Ruby on Rails server

**How:**
1. Read [`rais-spec/IMPLEMENTING.md`](rais-spec/IMPLEMENTING.md) — the complete guide
2. Read [`rais-spec/SPEC.md`](rais-spec/SPEC.md) — the normative protocol spec
3. Use `npx rais-compliance serve` for a reference server to test your client against
4. Use `npx rais-compliance http://localhost:PORT/api/chat` to verify your server
5. Open an issue using the "Community implementation" template to track progress
6. When passing RAIS v1 Core: open a PR to [`rais-spec/COMPATIBILITY.md`](rais-spec/COMPATIBILITY.md)

Your implementation does not need to live in this repo. Anywhere publicly accessible works.

---

### 2. Propose a protocol extension (RFC)

Protocol changes go through the RFC process. Read [`rfcs/README.md`](rfcs/README.md) first.

**What requires an RFC:**
- New RAIS event types
- New required fields on existing events
- Changed transport semantics

**What does NOT require an RFC:**
- New optional fields on existing events (open an issue)
- New SDK features in the npm packages (open a PR)
- New adapter packages (just build it and submit to ECOSYSTEM.md)

**How to submit an RFC:**
1. Open an issue using "RFC proposal" to discuss the idea informally
2. If it gets traction, copy [`rfcs/0000-template.md`](rfcs/0000-template.md) to `rfcs/RAIS-RFC-NNNN-title.md`
3. Fill in all required sections (motivation, wire format, backward compat, security, open questions)
4. Open a PR — this starts the Draft stage

---

### 3. Improve the official packages

Bug fixes, documentation, and test coverage for the official packages (`@react-ai-stream/react`, `@react-ai-stream/vue`, etc.).

#### Setup

```bash
git clone https://github.com/trimooo/react-ai-stream.git
cd react-ai-stream
pnpm install
pnpm build        # build all packages once (required before dev)
```

#### Development

```bash
pnpm dev          # watch mode for all packages
pnpm test         # run all tests (Vitest)
pnpm typecheck    # tsc --noEmit across all packages
pnpm build        # full production build
```

Run the demo app end-to-end:

```bash
cd apps/example
pnpm dev          # http://localhost:3000
```

Test compliance of the example server:

```bash
npx rais-compliance http://localhost:3000/api/chat
```

#### Code guidelines

- **TypeScript strict** — all code passes `tsc --noEmit` with `"strict": true`
- **Tests for core logic** — changes to `packages/core` need Vitest coverage
- **No breaking changes** without a major version bump — `useAIChat` signature, `Message` type, and `StreamChunk` are stable API surface
- **No new dependencies** without discussion — bundle size matters
- **No comments** unless the WHY is non-obvious

---

### 4. Improve docs, specs, or RFCs

- **Spec clarifications** — if SPEC.md is ambiguous or contradictory, open an issue with `spec-clarification` label
- **IMPLEMENTING.md** — if you tried to build an adapter and hit friction, PRs to improve the guide are very welcome
- **Docs site** — `apps/docs/pages/` is Nextra MDX. Fixes, examples, and new recipes always welcome

---

## Project structure

```
packages/
  core/              SSE parser, chunk normalizer, Zustand store, abort utils
  react/             useAIChat hook, AIChatProvider context
  ui/                Chat, MessageList, ChatInput, MarkdownRenderer
  vue/               useAIChat Vue 3 composable
  express/           raisMiddleware() for Express 4/5
  python-rais/       stream_response() Python async generator (pyproject.toml)
  devtools/          RAISDevTools panel + useAIChat wrapper
  rais-server/       rais-server CLI — reference standalone server
  rais-compliance/   rais-compliance CLI — protocol compliance test runner
  create-ai-stream-app/  npx create-ai-stream-app scaffolding CLI

apps/
  example/           Next.js 15 demo — 3-model parallel streaming via Groq
  vue-example/       Vite + Vue 3 demo
  docs/              Nextra docs site

rais-spec/           RAIS Protocol specification documents
rfcs/                RFC proposals for protocol extensions
```

---

## Good first contributions

Look for the [`good first issue`](https://github.com/trimooo/react-ai-stream/labels/good%20first%20issue) label. Typical good first contributions:

- Add a missing entry to `rais-spec/ECOSYSTEM.md` (known community project)
- Fix an ambiguity in `rais-spec/SPEC.md` or `IMPLEMENTING.md`
- Write a new recipe for `apps/docs/pages/recipes/`
- Add a test case to `packages/core` for an uncovered parser edge case
- Improve an error message to be more descriptive

---

## Submitting a PR

1. Fork and create a descriptive branch: `fix/sse-buffer-boundary` or `feat/hono-adapter`
2. Make changes, add tests if relevant
3. Run `pnpm test && pnpm typecheck` — both must pass
4. Open a PR against `master`:
   - Clear title
   - Link to issue if applicable
   - Before/after for behavior or UI changes

---

## Reporting bugs

Use the bug report template with:
- What you expected vs what happened
- Minimal reproduction (CodeSandbox or smallest snippet that shows the problem)
- Package versions: `@react-ai-stream/react`, Node, React

---

## Questions and discussion

[GitHub Discussions](https://github.com/trimooo/react-ai-stream/discussions):
- **Q&A** — integration questions, provider setup, TypeScript help
- **Show and tell** — built something with RAIS? Post it
- **Ideas** — pre-RFC informal protocol proposals

---

## Releasing (maintainers only)

1. Bump versions in changed `package.json` files
2. Run `pnpm install` to update the lockfile
3. Update `rais-spec/CHANGELOG.md` if there are protocol changes
4. Commit, push, tag: `git tag v0.x.x && git push origin --tags`
5. `pnpm publish -r` from the monorepo root
