# RAIS Protocol Changelog

All notable protocol changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Protocol versions follow [Semantic Versioning](https://semver.org/): breaking changes bump the major version, additive changes bump the minor version.

---

## [1.0.0] — 2026-05-14

Initial stable release of the RAIS Protocol v1.

### Defined

- **Transport**: Server-Sent Events (SSE) over HTTP with `Content-Type: text/event-stream`
- **Wire format**: `data: <JSON>\n\n` — one event per blank-line boundary
- **Event types** (normative):
  - `text` — append token to assistant message
  - `done` — stream complete
  - `error` — unrecoverable failure
- **Abort semantics**: `AbortController` on client; `req.on('close')` propagation on server
- **Reconnect behavior**: `id:` fields + `Last-Event-ID` header; 204 if not supported
- **WebSocket transport** (optional): same JSON payload, one text frame per event
- **Reserved event types** (non-normative, v2 candidates): `metadata`, `tool_call`, `reasoning`

### Reference implementations

- `@react-ai-stream/core` v0.1.4 (TypeScript — SSE parser, chunk normalizer)
- `@react-ai-stream/react` v0.1.4 (React hook)
- `@react-ai-stream/vue` (Vue 3 composable)
- `@react-ai-stream/express` (Express middleware)
- `rais` (Python async generator)

---

## Planned: [1.1.0]

Additive changes under consideration for v1.1 (non-breaking):

- **Optional `id` field on `text` events** — allows clients to deduplicate tokens on reconnect without server-side `id:` SSE fields
- **Optional `model` field on `done` event** — surface which model was used without a separate metadata event
- **`SHOULD` → `MUST` for `X-Accel-Buffering: no`** — based on common deployment pain points

---

## Planned: [2.0.0]

Breaking changes under consideration for v2 (requires major version bump):

- **`metadata` event** (promoted from reserved) — `{"type":"metadata","model":"...","tokens":42,"elapsed_ms":1200}`
- **`tool_call` event** (promoted from reserved) — `{"type":"tool_call","id":"...","name":"...","arguments":{}}`
- **`reasoning` event** (promoted from reserved) — `{"type":"reasoning","text":"<thinking token>"}`
- **Request format normalization** — standardize optional request fields (`model`, `temperature`, `max_tokens`) so adapters don't need per-provider mapping
