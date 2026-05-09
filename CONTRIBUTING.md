# Contributing to react-ai-stream

Thanks for your interest. This guide covers everything from a first bug fix to architectural contributions.

## Before you start

- **Check existing issues and PRs** — your idea may already be in progress.
- **For significant changes**, open an issue first to discuss the approach. This saves everyone time.
- **Scope**: This library is about streaming AI responses into React — messages, state, abort, and UI primitives. It is not an agent framework, RAG system, or orchestration engine. PRs that expand the scope will be declined.

## Setup

```bash
git clone https://github.com/trimooo/react-ai-stream.git
cd react-ai-stream
pnpm install
pnpm build        # build all packages once (required before dev)
```

## Development

```bash
pnpm dev          # watch mode for all packages (runs tsup --watch)
pnpm test         # run all tests (Vitest)
pnpm typecheck    # tsc --noEmit across all packages
pnpm build        # full production build
```

Run the demo app to test changes end-to-end:

```bash
cd apps/example
pnpm dev          # http://localhost:3000
```

## Project structure

```
packages/
  core/     SSE parser, chunk normalizer, Zustand store, abort utils — no React dep
  react/    useAIChat hook, AIChatProvider context
  ui/       Chat, MessageList, ChatInput, MarkdownRenderer components
apps/
  example/        Next.js 15 demo — 3-model parallel streaming via Groq
  docs/           Nextra docs site
```

## Good first issues

These are well-scoped and don't require deep architecture knowledge. Look for the [`good first issue`](https://github.com/trimooo/react-ai-stream/labels/good%20first%20issue) label on GitHub.

Typical good first contributions:

- Fix a typo or unclear section in the docs
- Add a missing CSS variable to the theming table
- Write a test for an uncovered edge case in `packages/core`
- Improve an error message to be more descriptive
- Add a new recipe to `apps/docs/pages/recipes/`

## Code guidelines

- **TypeScript strict** — all code must pass `tsc --noEmit` with `"strict": true`.
- **Tests for core logic** — changes to `packages/core` need Vitest coverage. Run `pnpm test` before opening a PR.
- **No breaking changes** without a major version bump. The `useAIChat` signature, `Message` type, and `StreamChunk` protocol are stable API surface.
- **No comments** unless the WHY is non-obvious: a hidden constraint, a workaround for a specific bug, behavior that would surprise a reader.
- **No new dependencies** without discussion. Bundle size matters.

## Submitting a PR

1. Fork the repo and create a descriptive branch: `git checkout -b fix/scroll-on-stream` or `feat/system-prompt`
2. Make your changes and add tests if relevant
3. Run `pnpm test && pnpm typecheck` — both must pass
4. Open a PR against `master`:
   - Clear title: what changed and why
   - Link to the issue it addresses if applicable
   - Include a before/after if it's a UI or behavior change

## Reporting bugs

Open an [issue](https://github.com/trimooo/react-ai-stream/issues/new?template=bug_report.md) with:

- What you expected vs what happened
- A minimal reproduction — CodeSandbox link or the smallest snippet that shows the problem
- Package versions: `@react-ai-stream/react`, Node, React

## Questions and ideas

Use [GitHub Discussions](https://github.com/trimooo/react-ai-stream/discussions):

- **Q&A** — integration questions, provider setup, TypeScript help
- **Ideas** — propose features before opening an issue
- **Show and tell** — built something with react-ai-stream? Post it

## Releasing (maintainers only)

1. Bump versions in all three `package.json` files
2. Run `pnpm install` to update the lockfile
3. Update `CHANGELOG.md`
4. Commit, push, tag: `git tag v0.x.x && git push origin --tags`
5. `pnpm publish -r` from the monorepo root
