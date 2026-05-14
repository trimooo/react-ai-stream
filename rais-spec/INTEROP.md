# RAIS Interoperability Test Matrix

This document defines the cross-language interoperability test matrix for RAIS v1. The goal is to verify that every combination of official client and server produces correct, identical behavior — without any client knowing what language wrote the server.

---

## What interoperability means

A RAIS server written in Python should be indistinguishable from one written in TypeScript, from the perspective of any RAIS client. A RAIS client written in Vue should work identically with a Go server and an Express server.

This is only true if:
1. Both implementations conform to SPEC.md
2. The spec is unambiguous enough that independent authors produce compatible results

The interoperability matrix tests both.

---

## How to run the matrix

### Setup

You need the following servers running:

```bash
# Express server (from packages/express)
cd apps/example && pnpm dev          # runs on :3000
# or run the mock server:
npx rais-compliance serve --port 3001 --scenario normal

# FastAPI server (from packages/python-rais)
cd packages/python-rais && uvicorn example:app --port 3002
```

### Run compliance against each

```bash
npx rais-compliance http://localhost:3001/api/chat    # Express / mock
npx rais-compliance http://localhost:3002/api/chat    # FastAPI
```

### Run browser matrix

Open `apps/example` and test each provider against each backend by pointing the hook endpoint manually.

---

## Official matrix

Each cell indicates whether the combination has been tested and passes.

### SSE transport

| Client → Server ↓ | React hook | Vue composable | `fetch` (raw) | `curl -N` |
|-------------------|------------|----------------|---------------|-----------|
| **Next.js route** | ✅ | ✅ | ✅ | ✅ |
| **Express middleware** | ✅ | ✅ | ✅ | ✅ |
| **FastAPI `rais`** | ✅ | ✅ | ✅ | ✅ |
| **Mock server (normal)** | ✅ | ✅ | ✅ | ✅ |

### WebSocket transport

| Client → Server ↓ | React hook (transport: 'ws') | Vue (planned) |
|-------------------|------------------------------|---------------|
| **Express WS** | ✅ | 🔜 |
| **FastAPI WS** | 🔜 | 🔜 |

### Abort / cancellation

| Client | Abort method | Server handles cleanly |
|--------|-------------|----------------------|
| React hook | `AbortController` | ✅ (Express, Next.js, FastAPI) |
| Vue composable | `AbortController` via `onUnmounted` | ✅ |
| `fetch` direct | `AbortController` | ✅ |

---

## Scenario coverage

The mock server (`npx rais-compliance serve`) provides these scenarios for stress testing:

| Scenario | Command | What it tests |
|----------|---------|---------------|
| `normal` | `--scenario normal` | Standard happy path — 10 tokens, clean done |
| `slow` | `--scenario slow` | 200ms between tokens — SSE parser buffering across multiple reads |
| `error` | `--scenario error` | Partial stream then `error` event — error state handling |
| `malformed` | `--scenario malformed` | Non-JSON lines + unknown event types — graceful ignore |
| `chunked` | `--scenario chunked` | Events fragmented across network writes — buffer boundary logic |
| `no-done` | `--scenario no-done` | Stream ends without `done` — compliance failure scenario |

### Running full scenario coverage

```bash
# Start mock in one terminal
npx rais-compliance serve --scenario slow

# Run compliance in another
npx rais-compliance http://localhost:3001/api/chat

# Repeat for each scenario
```

Expected results:

| Scenario | Compliance result |
|----------|------------------|
| `normal` | ✅ RAIS v1 Recommended (with SSE ID warning) |
| `slow` | ✅ All MUST pass — parser must handle delay |
| `error` | ✅ MUST pass — error event terminates stream correctly |
| `malformed` | ✅ MUST pass — malformed lines are skipped, stream still completes |
| `chunked` | ✅ MUST pass — buffer logic handles split events |
| `no-done` | ✕ `events.done` fails — intentional compliance failure |

---

## Adding a new language to the matrix

When a community adapter is submitted to ECOSYSTEM.md:

1. Run the full scenario suite against it:
   ```bash
   for scenario in normal slow error malformed chunked; do
     npx rais-compliance http://your-server/api/chat
   done
   ```
2. Run the React hook against it manually (open a browser, point `useAIChat` at the endpoint)
3. Record the results in a PR comment
4. Add to the matrix above

An implementation that passes all six scenarios and works with the React hook is considered **fully interoperable**.

---

## Known edge cases

### Proxy buffering

SSE streams through nginx or Cloudflare may be buffered if `X-Accel-Buffering: no` is not set. This causes the `slow` scenario to deliver all tokens at once at the end, rather than incrementally. This is a server configuration issue, not a protocol issue — but it looks like a slow parser bug.

Fix: add `X-Accel-Buffering: no` to server responses. The compliance `--scenario slow` test is specifically useful for detecting this.

### EventSource vs fetch

The browser `EventSource` API only supports GET requests, making it incompatible with RAIS's POST-based transport. Do not use `EventSource` for RAIS streams. Use `fetch` with a `ReadableStream` reader (which is what `@react-ai-stream/core` uses).

### WebSocket proxy passthrough

WebSocket traffic requires explicit proxy support. Cloudflare and most nginx configurations need explicit WebSocket proxy settings. This is separate from the SSE transport and only relevant when using `transport: 'ws'`.
