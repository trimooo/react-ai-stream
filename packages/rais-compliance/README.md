# rais-compliance

CLI compliance test runner for the [RAIS Protocol v1](https://github.com/trimooo/react-ai-stream).

Verify that any AI streaming server is RAIS-compliant in seconds.

[![npm](https://img.shields.io/npm/v/rais-compliance)](https://www.npmjs.com/package/rais-compliance)
[![RAIS v1](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e)](https://github.com/trimooo/react-ai-stream)

## Usage

```bash
npx rais-compliance http://localhost:3000/api/chat
```

No server yet? Start the built-in mock server:

```bash
# Terminal 1
npx rais-compliance serve

# Terminal 2
npx rais-compliance http://localhost:3001/api/chat
```

## Example output

```
RAIS Protocol v1 Compliance Test
Endpoint: http://localhost:3000/api/chat

  MUST (normative)
    headers.content-type      ✓  Content-Type is text/event-stream
    headers.cache-control     ✓  Cache-Control: no-cache present
    events.format             ✓  All 11 data lines are valid JSON
    events.text-type          ✓  All 10 text events have a "text" string field
    events.done               ✓  Exactly one done event, last in stream
    events.no-after-done      ✓  No events emitted after done
    events.has-text-tokens    ✓  Received 10 text token(s)

  SHOULD (recommended)
    headers.accel-buffering   ✓  X-Accel-Buffering: no present (nginx proxy-safe)
    events.sse-id             ✓  11 event(s) have id: fields (reconnect-safe)

  ABORT (resilience)
    abort.clean               ✓  AbortError thrown cleanly

✓  All 10 tests passed

  RAIS v1 Recommended ✓
```

## Mock server scenarios

```bash
npx rais-compliance serve --scenario normal   # default
npx rais-compliance serve --scenario slow     # 200ms between tokens
npx rais-compliance serve --scenario error    # stream ends with error event
npx rais-compliance serve --scenario chunked  # split SSE packets
npx rais-compliance serve --scenario malformed
npx rais-compliance serve --scenario no-done

npx rais-compliance serve --port 4000         # custom port
```

## Compliance checks

| Check | Level | What it verifies |
|---|---|---|
| `headers.content-type` | MUST | `Content-Type: text/event-stream` |
| `headers.cache-control` | MUST | `Cache-Control: no-cache` |
| `events.format` | MUST | All `data:` lines are valid JSON |
| `events.text-type` | MUST | Text events have a `text` string field |
| `events.done` | MUST | One `done` event, last in stream |
| `events.no-after-done` | MUST | No events after `done` |
| `events.has-text-tokens` | MUST | At least one text token received |
| `headers.accel-buffering` | SHOULD | `X-Accel-Buffering: no` for nginx |
| `events.sse-id` | SHOULD | `id:` fields on events |
| `abort.clean` | MUST | Client abort handled cleanly |

## Certification tiers

| Result | Badge |
|---|---|
| All 7 MUST pass | RAIS v1 Core |
| All MUST + SHOULD pass | RAIS v1 Recommended |

Add the badge to your README:

```md
![RAIS v1 Recommended](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e)
```

## License

MIT — part of [react-ai-stream](https://github.com/trimooo/react-ai-stream)
