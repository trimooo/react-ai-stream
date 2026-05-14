# RAIS Protocol Specification

**Version:** 1.0  
**Status:** Stable  
**Date:** 2026-05-14

## Abstract

RAIS (React AI Stream) is a minimal wire protocol for streaming AI-generated text from a server to a client. It defines three event types over Server-Sent Events (SSE) and an optional WebSocket transport. The protocol is intentionally minimal: implementations in any language require fewer than 50 lines of code.

---

## 1. Terminology

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

**Stream** — a single AI response generation, from the first `text` event to the `done` or `error` event.

**Chunk** — a single RAIS event frame.

**Client** — any consumer that opens a RAIS stream and renders the response.

**Server** — any endpoint that accepts a message list and produces a RAIS stream.

---

## 2. Transport

### 2.1 SSE (normative)

RAIS v1 **MUST** be delivered over [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html). The server **MUST** respond with the following HTTP headers:

```
Content-Type: text/event-stream
Cache-Control: no-cache
```

The `Connection: keep-alive` header **SHOULD** be sent when the server is not HTTP/2.

Proxies and reverse proxies (nginx, Caddy, Cloudflare) **SHOULD** set `X-Accel-Buffering: no` to disable response buffering.

### 2.2 Wire framing

Each RAIS event is a single `data:` field followed by a blank line:

```
data: <JSON payload>\r\n
\r\n
```

`\n\n` (LF only) is also acceptable. Implementations **MUST** accept both `\r\n\r\n` and `\n\n` as event boundaries.

Multiple `data:` lines per event are **NOT** used by RAIS v1. Each event is exactly one `data:` line.

### 2.3 WebSocket transport (optional)

RAIS events **MAY** be delivered over WebSocket. The JSON payload format is identical to SSE — only the framing changes.

**Client → Server** (sent once after the WebSocket opens):
```json
{"messages": [{"role": "user", "content": "Hello"}]}
```

Additional fields **MAY** be merged into this object (model, temperature, etc.).

**Server → Client** (one JSON text frame per RAIS event):
```json
{"type": "text", "text": "Hi"}
{"type": "done"}
```

Abort: the client **MUST** close the WebSocket with code `1000` to cancel a stream.

SSE is the **default and recommended** transport. WebSocket is useful when the server also needs to push events independently of a user message (bidirectional use cases).

---

## 3. Request format

RAIS does not mandate a specific request format. Servers **SHOULD** accept a JSON body with a `messages` array following the OpenAI message format:

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user",   "content": "Hello"}
  ]
}
```

Additional fields (`model`, `temperature`, `max_tokens`, etc.) are server-defined and out of scope for this specification.

---

## 4. Event types

### 4.1 `text` — token arrived

Emitted once per token or small chunk as the LLM produces output.

```json
{"type": "text", "text": "Hello"}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"text"` | yes | Event discriminant |
| `text` | `string` | yes | Token content. One or more characters. May not be a complete word or sentence. |

Clients **MUST** append the `text` value to the current assistant message content in the order received.

Empty strings (`"text": ""`) **SHOULD NOT** be emitted but clients **MUST** handle them gracefully (no-op append).

### 4.2 `done` — stream complete

Emitted exactly once when the LLM has finished generating.

```json
{"type": "done"}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"done"` | yes | Event discriminant |

After receiving `done`, the client **MUST** consider the stream finished and **MUST** close (or stop reading) the SSE connection.

Servers **MUST NOT** emit any events after `done`.

### 4.3 `error` — stream failed

Emitted when the server encounters an unrecoverable error during generation.

```json
{"type": "error", "error": "Upstream rate limit exceeded"}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"error"` | yes | Event discriminant |
| `error` | `string` | yes | Human-readable description of the failure. **MUST NOT** contain secrets (API keys, stack traces with internal paths). |

After an `error` event, the stream ends. Servers **MUST NOT** emit further events. Clients **MUST** surface the error to the user and stop appending tokens.

---

## 5. Wire examples

### 5.1 Normal completion

```
data: {"type":"text","text":"Hi"}

data: {"type":"text","text":" there"}

data: {"type":"text","text":"!"}

data: {"type":"done"}

```

### 5.2 Error mid-stream

```
data: {"type":"text","text":"Let me think"}

data: {"type":"error","error":"Context window exceeded"}

```

### 5.3 Single-token stream

```
data: {"type":"text","text":"Yes."}

data: {"type":"done"}

```

---

## 6. Abort semantics

### 6.1 Client-initiated abort

Clients that need to cancel a stream (e.g. the user clicks Stop) **MUST** abort the underlying HTTP request using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController):

```ts
const controller = new AbortController()
fetch('/api/chat', { signal: controller.signal, method: 'POST', ... })

// To cancel:
controller.abort()
```

The client **MUST** silently ignore `AbortError` — a cancelled stream is not a failure condition.

### 6.2 Server-side abort handling

RAIS-compliant servers **SHOULD** propagate the abort signal to the upstream LLM call so that token generation actually stops (avoiding wasted compute and cost).

Servers **MUST** handle aborted connections without leaking goroutines, async tasks, or file descriptors.

### 6.3 WebSocket abort

For WebSocket transport, the client **MUST** close the WebSocket with close code `1000` to signal an intentional cancellation. The server **SHOULD** treat a clean WebSocket close as an abort signal.

---

## 7. Reconnect behavior

SSE clients may attempt to reconnect automatically after a dropped connection (e.g. network interruption). RAIS servers **MUST NOT** re-emit tokens that were already sent in a previous connection.

To support safe reconnection, servers **SHOULD**:

1. Emit an `id:` field with each event:
   ```
   id: 42
   data: {"type":"text","text":"Hello"}
   
   ```
2. Honor the `Last-Event-ID` request header on reconnect and resume from the next unsent event.

If a server does not support resumable streams, it **SHOULD** respond with HTTP `204 No Content` when it receives a reconnect request containing `Last-Event-ID`.

---

## 8. Unrecognized event types

Clients **MUST** silently ignore events with unrecognized `type` values. This ensures forward compatibility as new event types are added in future protocol versions.

Servers **MUST NOT** emit event types that are not defined in the version of the protocol they claim to implement, except as explicitly reserved below.

---

## 9. Reserved event types (v2 candidates)

The following `type` values are reserved for future protocol versions. Servers **MUST NOT** emit them in RAIS v1. Clients **SHOULD** silently ignore them if received.

| Type | Proposed purpose |
|------|-----------------|
| `metadata` | Stream-level metadata (model name, latency, token count, finish reason) |
| `tool_call` | LLM-initiated tool call (function calling, code execution) |
| `reasoning` | Extended thinking / chain-of-thought tokens |
| `partial_tool_result` | Streaming partial tool call results |

---

## 10. CORS

Servers **SHOULD** set appropriate CORS headers when the client and server are on different origins:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
```

For credentialed requests, replace `*` with the specific allowed origin.

---

## 11. Security considerations

- Servers **MUST NOT** reflect API keys, session tokens, or other secrets in `error` event payloads.
- Servers **SHOULD NOT** log message content by default (privacy by design).
- Servers **SHOULD** validate and sanitize the `messages` array before forwarding to the upstream LLM.
- Servers **SHOULD** enforce rate limits and maximum message counts to prevent abuse.

---

## 12. Versioning

The current version is **RAIS v1**.

- **Breaking changes** (new required fields, changed semantics for existing events) increment the major version (v2).
- **Additive changes** (new optional fields, reserved events promoted to normative) increment the minor version (v1.1).

The protocol version is communicated out-of-band through documentation and package versions. There is no `version` field in the wire format — this keeps the protocol simple and avoids version negotiation overhead.

Future versions will remain backward compatible where possible: RAIS v2 clients will accept RAIS v1 streams.

---

## Appendix A — Minimal server implementation (TypeScript)

```ts
import { createServer } from 'http'

createServer(async (req, res) => {
  const { messages } = JSON.parse(await body(req))

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    for await (const token of callLLM(messages)) {
      send({ type: 'text', text: token })
    }
    send({ type: 'done' })
  } catch (err) {
    send({ type: 'error', error: (err as Error).message })
  } finally {
    res.end()
  }
}).listen(3001)
```

## Appendix B — Minimal server implementation (Python)

```python
import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def rais_stream(messages):
    async for token in call_llm(messages):
        yield f"data: {json.dumps({'type': 'text', 'text': token})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"

@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(rais_stream(req.messages), media_type="text/event-stream")
```

## Appendix C — Minimal client implementation (TypeScript)

```ts
async function* streamRAIS(endpoint: string, messages: Message[]): AsyncGenerator<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop() ?? ''
    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const event = JSON.parse(line.slice(6))
        if (event.type === 'text') yield event.text
        else if (event.type === 'done') return
        else if (event.type === 'error') throw new Error(event.error)
      }
    }
  }
}
```
