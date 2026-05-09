# Contributing

Thanks for your interest in contributing to `react-ai-stream`.

## Setup

```bash
git clone https://github.com/trimooo/react-ai-stream.git
cd react-ai-stream
pnpm install
pnpm build
```

## Development

```bash
pnpm dev          # watch mode for all packages
pnpm test         # run all tests
pnpm typecheck    # type check all packages
```

## Project structure

```
packages/
  core/     SSE parser, chunk normalizer, message store — no React dep
  react/    useAIChat hook, AIChatProvider context
  ui/       Chat, MessageList, MessageBubble components
apps/
  example/        Full-featured Next.js 15 demo
  nextjs-basic/   Minimal Next.js integration
```

## Guidelines

- **Keep scope tight.** This library is about streaming, chat state, and AI UI primitives. Don't add agent systems, RAG, or orchestration.
- **Tests for core logic.** `packages/core` changes need Vitest tests.
- **TypeScript strict.** All code must pass `tsc --noEmit` with strict mode.
- **No breaking changes** to the public API without a major version bump.

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b feat/my-thing`
2. Make your changes and add tests if relevant
3. Run `pnpm test && pnpm typecheck` — both must pass
4. Open a PR against `master` with a clear description of the change and why

## Reporting bugs

Open an issue at [github.com/trimooo/react-ai-stream/issues](https://github.com/trimooo/react-ai-stream/issues) with:
- What you expected vs. what happened
- A minimal reproduction (CodeSandbox or repo link)
- Your package versions (`@react-ai-stream/react`, Node, React)
