# Testing Guide

Complete testing reference for every package in this monorepo.
Run anything from the repo root unless a specific directory is noted.

---

## Quick start

```bash
# Run every test suite at once
pnpm --filter "./packages/*" test

# Build everything first (required for workspace cross-references)
pnpm build

# Run tests + build in one turbo pass
pnpm turbo test
```

---

## Test inventory

| Package | Files | Tests | Environment |
|---|---|---|---|
| `@react-ai-stream/core` | 4 | 27 | node |
| `@react-ai-stream/react` | 2 | 17 | jsdom |
| `@react-ai-stream/ui` | 2 | 13 | jsdom |
| `@react-ai-stream/express` | 2 | 14 | node |
| `@react-ai-stream/vue` | 1 | 11 | jsdom |
| `@react-ai-stream/devtools` | 1 | 18 | jsdom |
| `rais-compliance` | 1 | 7 | node (integration) |
| `rais-server` | 1 | 10 | node (integration) |
| **Total** | **16** | **117** | |

---

## Package-by-package guide

---

### `@react-ai-stream/core`

**What it contains:** SSE parser, chunk normalizer (OpenAI/Anthropic/Custom), OpenAI provider, Anthropic provider, message store, error utilities.

**Run tests:**
```bash
pnpm --filter @react-ai-stream/core test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/sse-parser.test.ts` | 5 | Parses single events, stops on `[DONE]`, handles split chunks, skips non-data lines, multiple events in sequence |
| `tests/chunk-normalizer.test.ts` | 9 | OpenAI delta→text, finish_reason→done, null delta, invalid JSON; Anthropic content_block_delta, message_stop, unknown types; Custom passthrough |
| `tests/openai-provider.test.ts` | 6 | Streams text chunks, stops after `[DONE]`, default model gpt-4o, system message prepend, error on non-2xx, rethrows AbortError |
| `tests/anthropic-provider.test.ts` | 7 | Streams from content_block_delta, stops at message_stop, default model claude-sonnet-4-6, system as top-level field, skips non-delta events, error on non-2xx, rethrows AbortError |

**Manual checks:**

```bash
# Verify TypeScript compiles with strict mode
pnpm --filter @react-ai-stream/core typecheck

# Inspect SSE parser directly in Node
node -e "
const { parseSSE } = require('./packages/core/dist/index.js')
const enc = new TextEncoder()
const stream = new ReadableStream({ start(c) {
  c.enqueue(enc.encode('data: {\"type\":\"text\",\"text\":\"hello\"}\n\ndata: {\"type\":\"done\"}\n\n'))
  c.close()
}})
;(async () => { for await (const chunk of parseSSE(stream)) console.log(chunk) })()"
```

---

### `@react-ai-stream/react`

**What it contains:** `useAIChat` hook (streams AI responses into React state), `AIChatProvider` (context-based shared client), `AIChatContext`.

**Run tests:**
```bash
pnpm --filter @react-ai-stream/react test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/useAIChat.test.tsx` | 13 | Initial state, user+assistant messages added, text accumulation, `onToken`/`onComplete`/`onError` callbacks, error chunk with/without message, loading lifecycle, `stop()`, `clearMessages()`, dedup of concurrent sends, multi-turn message history, endpoint string option |
| `tests/AIChatProvider.test.tsx` | 4 | Provides client via context, null outside provider, renders children, exact client reference preserved |

**Every possible test scenario:**

```bash
# Unit tests
pnpm --filter @react-ai-stream/react test

# TypeScript
pnpm --filter @react-ai-stream/react typecheck

# Watch mode during development
pnpm --filter @react-ai-stream/react exec vitest

# Test with real endpoint (start example app first)
# 1. pnpm --filter example dev
# 2. Import useAIChat in browser devtools and send a message
```

**Scenarios by hook option:**

| Option | Covered | How |
|---|---|---|
| `{ client: AIClient }` | ✓ | All unit tests use a mock client |
| `{ endpoint: string }` | ✓ | `tests/useAIChat.test.tsx` → "accepts endpoint string" |
| `{ provider: 'openai', apiKey }` | manual | Needs real key; use `apps/example` |
| `{ provider: 'anthropic', apiKey }` | manual | Needs real key; use `apps/example` |
| `AIChatProvider` context | ✓ | `tests/AIChatProvider.test.tsx` |

---

### `@react-ai-stream/ui`

**What it contains:** `<Chat>`, `<MessageList>`, `<MessageBubble>`, `<MarkdownRenderer>`, `<ChatInput>`, `useCopyToClipboard`.

**Run tests:**
```bash
pnpm --filter @react-ai-stream/ui test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/useCopyToClipboard.test.ts` | 7 | Initial false state, copies text, writes to clipboard API, resets after timeout, custom timeout, timer reset on second copy, stays false when clipboard fails |
| `tests/Chat.test.tsx` | 6 | Renders without crash, shows messages, Enter key triggers onSend, custom className, typing indicator when loading + no assistant content, no typing indicator when assistant is streaming |

**Every possible test scenario:**

```bash
# Unit + component tests
pnpm --filter @react-ai-stream/ui test

# TypeScript
pnpm --filter @react-ai-stream/ui typecheck

# Visual test — start example app
pnpm --filter example dev
# Navigate to http://localhost:3000 and test:
# - Send a message (streaming should appear token by token)
# - Markdown rendering (send: "write a code block in python")
# - Copy button on assistant messages
# - Stop button during streaming
# - Long message scrolling behavior

# Custom UI example
pnpm --filter custom-ui dev
# Navigate to http://localhost:3002
```

**Components without automated tests (visual only):**

| Component | Manual test |
|---|---|
| `<MessageBubble>` | Open example app, verify user/assistant bubble styles |
| `<MessageList>` | Send 20+ messages, verify auto-scroll to bottom |
| `<MarkdownRenderer>` | Send markdown with code fences, tables, bold/italic |

---

### `@react-ai-stream/express`

**What it contains:** `raisMiddleware` factory, `writeSseHeaders`, `pipeChunksToResponse`.

**Run tests:**
```bash
pnpm --filter @react-ai-stream/express test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/sse-writer.test.ts` | 10 | All 4 SSE headers set, flushHeaders called, text chunks written as `data:` lines, `end()` after done, stops after done (no extra writes), stops after error, skips `end()` if already ended |
| `tests/middleware.test.ts` | 4 | SSE headers + streaming chunks via custom handler, messages forwarded from req.body, empty messages array fallback, AbortSignal triggered on req close |

**Every possible test scenario:**

```bash
# Unit tests (no real server needed)
pnpm --filter @react-ai-stream/express test

# TypeScript
pnpm --filter @react-ai-stream/express typecheck

# Integration test — mount middleware in a real Express app
node -e "
const express = require('express')
const { raisMiddleware } = require('./packages/express/dist/index.js')
const app = express()
app.use(express.json())
app.post('/api/chat', raisMiddleware({
  handler: async function*(msgs, signal) {
    yield { type: 'text', text: 'Hello from express!' }
    yield { type: 'done' }
  }
}))
app.listen(4000, () => console.log('listening on 4000'))
"
# Then test: curl -N -X POST http://localhost:4000/api/chat \
#   -H 'Content-Type: application/json' \
#   -d '{"messages":[{"role":"user","content":"hi"}]}'

# Compliance test against the express server
npx rais-compliance http://localhost:4000/api/chat
```

**Provider option scenarios:**

| Option | Status |
|---|---|
| `{ handler: async function*(...) }` | ✓ covered in unit tests |
| `{ provider: 'openai', apiKey }` | manual — needs `OPENAI_API_KEY` |
| `{ provider: 'anthropic', apiKey }` | manual — needs `ANTHROPIC_API_KEY` |

---

### `@react-ai-stream/vue`

**What it contains:** `useAIChat` composable — Vue 3 equivalent of the React hook. Returns `shallowRef`s for `messages`, `loading`, `error`.

**Run tests:**
```bash
pnpm --filter @react-ai-stream/vue test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/useAIChat.test.ts` | 11 | Initial state, user+assistant messages, text accumulation, `onToken`/`onComplete`/`onError`, error chunk, loading lifecycle, `stop()`, `clearMessages()`, dedup of concurrent sends, abort on unmount |

**Every possible test scenario:**

```bash
# Unit tests
pnpm --filter @react-ai-stream/vue test

# TypeScript
pnpm --filter @react-ai-stream/vue typecheck

# Visual test — Vue example app
pnpm --filter vue-example dev
# Navigate to http://localhost:5173
# Send a message, observe reactivity, test stop button

# Verify SSE headers from the Vue example (uses apps/example backend)
# 1. pnpm --filter example dev  (starts Next.js on :3000)
# 2. In Vue app, point endpoint to http://localhost:3000/api/chat
```

---

### `@react-ai-stream/devtools`

**What it contains:** `devStore` (singleton telemetry store), `useAIChat` wrapper (drop-in that emits to devStore), `<RAISDevTools>` overlay panel.

**Run tests:**
```bash
pnpm --filter @react-ai-stream/devtools test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/store.test.ts` | 18 | subscribe/getSnapshot, new state reference on change, unsubscribe, `onSend` creates session + log entry, `onToken` increments count, `onComplete` sets done + tokensPerSec, `onError` marks error + adds log, `onAbort` marks aborted, `clear` resets everything, listener called on clear, MAX_LOG=200 cap, independent multi-session tracking |

**Every possible test scenario:**

```bash
# Store unit tests (pure, no DOM)
pnpm --filter @react-ai-stream/devtools test

# TypeScript
pnpm --filter @react-ai-stream/devtools typecheck

# Visual test — add RAISDevTools to example app
# 1. In apps/example/app/layout.tsx, import and render <RAISDevTools />
# 2. pnpm --filter example dev
# 3. Open http://localhost:3000
# 4. Send messages — DevTools panel shows sessions, token counts, timing
# 5. Trigger an error (stop your API key temporarily) — error state shown
# 6. Test abort: click Stop during streaming — aborted state shown
```

---

### `rais-compliance`

**What it contains:** CLI compliance runner (`rais-compliance <endpoint>`), mock server (`rais-compliance serve --scenario <name>`), 10 protocol checks (7 MUST + 2 SHOULD + 1 ABORT).

**Run tests:**
```bash
pnpm --filter rais-compliance test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/runner.test.ts` | 7 | Normal → zero failures, error scenario → zero failures (error termination is valid), no-done → ≥1 failure detected, malformed → ≥1 failure detected, chunked → zero failures, unreachable endpoint → failed=1 |

**Every possible test scenario:**

```bash
# Automated integration tests (spins up mock servers on ports 3097–3101)
pnpm --filter rais-compliance test

# Manual — test every mock scenario by hand
node packages/rais-compliance/dist/index.js serve --scenario normal --port 3099 &
node packages/rais-compliance/dist/index.js http://localhost:3099/api/chat

# All 6 scenarios
for scenario in normal slow error malformed chunked no-done; do
  node packages/rais-compliance/dist/index.js serve --scenario $scenario --port 3099 &
  PID=$!
  sleep 0.5
  echo "=== $scenario ==="
  node packages/rais-compliance/dist/index.js http://localhost:3099/api/chat
  kill $PID 2>/dev/null
  sleep 0.2
done

# Test against your real endpoint
node packages/rais-compliance/dist/index.js http://localhost:3000/api/chat

# Published CLI
npx rais-compliance http://localhost:3000/api/chat

# Curl the mock server manually
node packages/rais-compliance/dist/index.js serve --scenario chunked --port 3099 &
curl -N -X POST http://localhost:3099/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
```

**Compliance check breakdown:**

| Check | Level | What it verifies |
|---|---|---|
| `headers.content-type` | MUST | `Content-Type: text/event-stream` |
| `headers.cache-control` | MUST | `Cache-Control: no-cache` |
| `events.format` | MUST | All `data:` lines are valid JSON |
| `events.text-type` | MUST | Text events have a `text` string field |
| `events.done` | MUST | One `done` event last (skip if stream ends with `error`) |
| `events.no-after-done` | MUST | No events emitted after `done` |
| `events.has-text-tokens` | MUST | At least one text token received |
| `headers.accel-buffering` | SHOULD | `X-Accel-Buffering: no` for nginx |
| `events.sse-id` | SHOULD | `id:` fields on events (reconnect safety) |
| `abort.clean` | MUST | Client abort doesn't hang or error unexpectedly |

---

### `rais-server`

**What it contains:** `createRaisServer(config)` — HTTP server factory. Handles CORS preflight, validates messages, routes to OpenAI/Anthropic providers, writes RAIS-compliant SSE.

**Run tests:**
```bash
pnpm --filter rais-server test
```

**Test files:**

| File | Tests | What is covered |
|---|---|---|
| `tests/server.test.ts` | 10 | 404 for non-chat paths, 404 for GET /api/chat, OPTIONS 204 + CORS headers, 400 for invalid JSON, 400 for empty messages, 200 with SSE content-type on valid POST, response contains `"type":"text"` and `"type":"done"`, CORS headers on POST, CORS disabled → 204 OPTIONS without CORS headers, CORS disabled → no CORS on POST |

**Every possible test scenario:**

```bash
# Unit tests (providers mocked — no API keys needed)
pnpm --filter rais-server test

# TypeScript
pnpm --filter rais-server typecheck

# Full manual test with real API key
export OPENAI_API_KEY=sk-...
node packages/rais-server/dist/index.js

# Then in another terminal
npx rais-compliance http://localhost:3001/api/chat

# Test each provider
export ANTHROPIC_API_KEY=sk-ant-...
node packages/rais-server/dist/index.js --provider anthropic

export GROQ_API_KEY=gsk_...
node packages/rais-server/dist/index.js --provider groq

# All CLI flags
node packages/rais-server/dist/index.js \
  --provider openai \
  --model gpt-4o \
  --port 4000 \
  --system "You are concise" \
  --max-tokens 256 \
  --no-cors

# Curl test
curl -N -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"say hello in one word"}]}'

# Error handling — bad JSON
curl -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d 'not json'
# → 400 {"error":"Invalid JSON body..."}

# Error handling — empty messages
curl -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[]}'
# → 400 {"error":"messages must be a non-empty array"}

# Error handling — wrong path
curl http://localhost:3001/wrong
# → 404 {"error":"Not found..."}

# Provider auto-detection priority: ANTHROPIC_API_KEY > OPENAI_API_KEY > GROQ_API_KEY
unset OPENAI_API_KEY GROQ_API_KEY
export ANTHROPIC_API_KEY=sk-ant-...
node packages/rais-server/dist/index.js
# → should pick anthropic automatically
```

---

### `create-ai-stream-app`

No automated tests (interactive CLI with `@clack/prompts` — requires terminal input).

**Manual test — full interactive flow:**

```bash
# Build first
pnpm --filter create-ai-stream-app build

# Run interactively
node packages/create-ai-stream-app/dist/index.js

# Answer prompts:
# 1. Project name: my-test-app
# 2. Provider: OpenAI (or any)
# 3. UI: Drop-in <Chat>
# 4. Install deps: No (faster)

# Verify scaffold output
ls my-test-app/
# Expected: app/, next.config.ts, tsconfig.json, .gitignore, package.json, .env.example

# Verify package.json placeholder was replaced
grep "my-test-app" my-test-app/package.json

# Verify .gitignore was renamed from _gitignore
cat my-test-app/.gitignore

# Test with install
node packages/create-ai-stream-app/dist/index.js
# → answer "yes" to install deps, verify node_modules appears

# Test via npx (published package)
npx create-ai-stream-app

# Verify each provider template
for provider in openai anthropic groq custom; do
  node packages/create-ai-stream-app/dist/index.js <<EOF
test-$provider
$provider
chat
false
EOF
  ls test-$provider/app/api/chat/route.ts
done
```

**What to verify per scaffold:**

| Check | How |
|---|---|
| `package.json` name matches input | `grep "name" <project>/package.json` |
| `.gitignore` exists (not `_gitignore`) | `ls -la <project>/.gitignore` |
| API route matches chosen provider | `cat <project>/app/api/chat/route.ts` |
| `.env.example` has correct key name | `cat <project>/.env.example` |
| `pnpm dev` starts without errors | `cd <project> && pnpm install && pnpm dev` |

---

### `rais` (Python package)

**Location:** `packages/python-rais/`  
**Requires:** Python 3.10+, `pip install -e ".[all]"` (installs openai + anthropic SDKs)

```bash
cd packages/python-rais

# Install in editable mode
pip install -e ".[all]"

# Unit test (if tests/ directory exists)
python -m pytest

# Manual RAIS stream test — FastAPI
pip install fastapi uvicorn
python -c "
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from rais import stream_response

app = FastAPI()

@app.post('/api/chat')
async def chat(req: dict):
    return StreamingResponse(
        stream_response(req['messages'], provider='openai'),
        media_type='text/event-stream'
    )
"
# uvicorn main:app --port 3002
# npx rais-compliance http://localhost:3002/api/chat

# Verify output format
python -c "
from rais.core import rais_event
print(rais_event({'type': 'text', 'text': 'hello'}))
# Expected: data: {\"type\": \"text\", \"text\": \"hello\"}\n\n
"
```

---

## Cross-package integration tests

These verify the full stack from React hook → backend → SSE → rendered message.

### Test 1: React hook ↔ Next.js API route

```bash
# 1. Start the example app
pnpm --filter example dev

# 2. Open http://localhost:3000 in browser
# 3. Send "hello" in the chat
# 4. Verify streaming tokens appear one by one
# 5. Verify no errors in browser console
# 6. Run compliance check
node packages/rais-compliance/dist/index.js http://localhost:3000/api/chat
# Expected: ✓ All 10 tests passed — RAIS v1 Recommended
```

### Test 2: React hook ↔ Express middleware

```bash
# 1. Create a test Express server (see express section above)
# 2. Point useAIChat to that server
# 3. Run compliance check
node packages/rais-compliance/dist/index.js http://localhost:4000/api/chat
```

### Test 3: Vue composable ↔ rais-server

```bash
# 1. Start rais-server (needs a provider key)
export OPENAI_API_KEY=sk-...
node packages/rais-server/dist/index.js --port 3001

# 2. Start vue-example app pointing to rais-server
pnpm --filter vue-example dev

# 3. In Vue app, set endpoint to http://localhost:3001/api/chat
# 4. Send a message, verify streaming works
```

### Test 4: Full compliance matrix

```bash
# Start all servers, run compliance against each
servers=(
  "http://localhost:3000/api/chat"   # apps/example (Next.js)
  "http://localhost:3001/api/chat"   # rais-server
  "http://localhost:4000/api/chat"   # express middleware
)

for endpoint in "${servers[@]}"; do
  echo "=== $endpoint ==="
  node packages/rais-compliance/dist/index.js "$endpoint"
done
```

---

## Debugging failing tests

### "Cannot find module" errors

```bash
# Rebuild all packages first
pnpm build
```

### Mock server port conflicts

The compliance tests use ports 3097–3101. If something else is running there:
```bash
# Check what's using those ports
netstat -ano | findstr "3097\|3098\|3099\|3100\|3101"
# Kill it, or change PORT constants in packages/rais-compliance/tests/runner.test.ts
```

### Vue tests failing with "onUnmounted is called" warning

Run tests in isolation — the composable uses Vue lifecycle hooks that need a component context:
```bash
pnpm --filter @react-ai-stream/vue exec vitest --reporter=verbose
```

### React tests failing with "act(...)" warnings

The hook is async — always await inside `act(async () => { ... })`. See existing tests in `packages/react/tests/useAIChat.test.tsx` for the correct pattern.

### jsdom `scrollIntoView` not a function

The UI package has a setup file that patches this. If you see this error outside that package, add to your test setup:
```ts
Element.prototype.scrollIntoView = () => {}
```

---

## Adding new tests

Each package follows this structure:
```
packages/<name>/
├── src/           # source
├── tests/         # test files (*.test.ts or *.test.tsx)
├── vitest.config.ts
└── package.json   # has "test": "vitest run"
```

Test environment per package:

| Package | Environment | Why |
|---|---|---|
| core | node | No DOM needed |
| react | jsdom | React hooks need DOM |
| ui | jsdom | React components need DOM |
| express | node | HTTP/Node APIs only |
| vue | jsdom | @vue/test-utils needs DOM |
| devtools | jsdom | React context needed |
| rais-compliance | node | HTTP integration tests |
| rais-server | node | HTTP integration tests |
