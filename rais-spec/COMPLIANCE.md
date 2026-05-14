# RAIS Protocol Compliance Checklist

Use this checklist to verify that your server or client implementation is RAIS v1 compliant.

For automated verification, run:

```bash
npx rais-compliance http://your-server.example.com/api/chat
```

---

## Server requirements

### MUST (normative)

- [ ] Respond with `Content-Type: text/event-stream`
- [ ] Respond with `Cache-Control: no-cache`
- [ ] Emit each event as a single `data: <JSON>\n\n` line
- [ ] Emit `{"type":"done"}` as the final event when the stream ends normally
- [ ] Emit `{"type":"error","error":"<message>"}` when an unrecoverable error occurs (instead of a non-2xx HTTP response mid-stream)
- [ ] Stop emitting events after `done` or `error`
- [ ] Handle aborted connections without leaking goroutines / async tasks / file descriptors
- [ ] Not include secrets, API keys, or stack traces in `error` event payloads

### SHOULD (recommended)

- [ ] Set `Connection: keep-alive` (HTTP/1.1)
- [ ] Set `X-Accel-Buffering: no` (when behind nginx/Caddy)
- [ ] Set appropriate CORS headers for cross-origin clients
- [ ] Forward the abort signal to the upstream LLM call
- [ ] Emit `id:` fields for each event (reconnect safety)
- [ ] Honor `Last-Event-ID` on reconnect (or return 204 if not supported)
- [ ] Not log or persist message content by default

### MUST NOT

- [ ] Emit events after `done`
- [ ] Emit reserved event types (`metadata`, `tool_call`, `reasoning`)
- [ ] Re-emit already-sent tokens on SSE reconnect

---

## Client requirements

### MUST (normative)

- [ ] Parse `data: <JSON>` lines, delimited by `\n\n` boundaries
- [ ] Buffer partial events across network chunks (never split on `\n` alone)
- [ ] Parse the `type` field to dispatch events
- [ ] Append `text` event content to the current assistant message, in order received
- [ ] Stop consuming the stream after `done` or `error`
- [ ] Surface the `error` message to the user on an `error` event
- [ ] Use `AbortController` for user-initiated cancellation
- [ ] Silently swallow `AbortError` (a cancelled stream is not a failure)
- [ ] Silently ignore unrecognized event types

### SHOULD (recommended)

- [ ] Show a loading / streaming indicator while tokens are arriving
- [ ] Provide a Stop / Cancel action during streaming
- [ ] Not re-render the entire message list on every token (only the accumulating message)

---

## Automated compliance tests

`npx rais-compliance <endpoint>` runs the following test suite against your server:

| Test | What it checks |
|------|----------------|
| `headers.content-type` | Response has `Content-Type: text/event-stream` |
| `headers.cache-control` | Response has `Cache-Control: no-cache` |
| `events.format` | Each event is `data: <valid JSON>\n\n` |
| `events.text-type` | `text` events have a `text` string field |
| `events.done` | Stream ends with exactly one `done` event |
| `events.no-after-done` | No events emitted after `done` |
| `events.error-format` | `error` events have an `error` string field |
| `abort.clean` | Server handles request abort without hanging |

Tests marked `SHOULD` produce warnings; tests marked `MUST` produce failures.

---

## Certification levels

| Level | Criteria | Badge |
|-------|----------|-------|
| **RAIS v1 Core** | All MUST items pass in automated tests | ![RAIS v1 Core](https://img.shields.io/badge/RAIS-v1%20Core-3b82f6) |
| **RAIS v1 Recommended** | All MUST + SHOULD items pass | ![RAIS v1 Recommended](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e) |
| **RAIS v1 Full** | Recommended + reconnect support (`id:` + `Last-Event-ID`) | ![RAIS v1 Full](https://img.shields.io/badge/RAIS-v1%20Full-7c3aed) |

### Adding a badge to your project

After running `npx rais-compliance` successfully, the CLI prints the badge markdown. You can also copy it manually:

**RAIS v1 Core:**
```markdown
![RAIS v1 Core certified](https://img.shields.io/badge/RAIS-v1%20Core-3b82f6)
```

**RAIS v1 Recommended:**
```markdown
![RAIS v1 Recommended](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e)
```

**RAIS v1 Full:**
```markdown
![RAIS v1 Full](https://img.shields.io/badge/RAIS-v1%20Full-7c3aed)
```
