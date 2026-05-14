# Implementing RAIS

This guide is for developers who want to write a new RAIS-compliant server, client, or framework adapter. You do not need to use any package from this repository — the spec is self-contained.

---

## What you need

- The normative specification: [`SPEC.md`](SPEC.md)
- The compliance checklist: [`COMPLIANCE.md`](COMPLIANCE.md)
- 30–50 lines of code

That's it. No SDK dependency. No code generation. No schema to import.

---

## Implementing a server

A RAIS-compliant server accepts an HTTP POST with a JSON body containing a `messages` array and responds with an SSE stream.

### Minimum viable implementation

```python
# Python — FastAPI
import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def rais_stream(messages):
    async for token in your_llm_call(messages):          # your LLM logic here
        yield f'data: {json.dumps({"type": "text", "text": token})}\n\n'
    yield f'data: {json.dumps({"type": "done"})}\n\n'

@app.post("/api/chat")
async def chat(req: Request):
    body = await req.json()
    return StreamingResponse(
        rais_stream(body["messages"]),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )
```

```typescript
// TypeScript — Express
import express from 'express'

const app = express()
app.use(express.json())

app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    for await (const token of yourLLMCall(req.body.messages)) {  // your LLM logic
      send({ type: 'text', text: token })
    }
    send({ type: 'done' })
  } catch (err) {
    send({ type: 'error', error: (err as Error).message })
  } finally {
    res.end()
  }
})
```

See `SPEC.md` Appendix A (TypeScript) and Appendix B (Python) for additional examples.

### Checklist before shipping

```bash
npx rais-compliance http://localhost:PORT/api/chat
```

All MUST tests must pass for RAIS v1 Core certification.

---

## Implementing a client

A RAIS-compliant client sends an HTTP POST with a JSON body and processes the SSE response.

### Minimum viable implementation

```typescript
// TypeScript — browser fetch
async function* streamRAIS(endpoint: string, messages: Message[]) {
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
        // Unknown types: silently ignore (required by spec §8)
      }
    }
  }
}
```

```go
// Go — net/http
func streamRAIS(ctx context.Context, endpoint string, messages []Message) (<-chan string, <-chan error) {
    ch := make(chan string)
    errCh := make(chan error, 1)
    go func() {
        defer close(ch)
        // POST, read response body, split on \n\n, parse data: lines
        // Yield text events to ch, close on done, send error on errCh
        // Silently ignore unknown event types
    }()
    return ch, errCh
}
```

### Key implementation notes

1. **Buffer across chunks**: Do not split on `\n` alone. Split on `\n\n`. A single network read may contain half an event.
2. **Silently ignore unknown types**: If `event.type` is not `text`, `done`, or `error`, skip it. This is required for forward compatibility with future protocol versions.
3. **AbortController**: Expose a way for callers to cancel the stream. Pass the abort signal to `fetch`. Swallow `AbortError`.
4. **Error vs. abort**: `error` events are protocol errors (surface to user). `AbortError` is user cancellation (silent).

---

## Writing a framework adapter

A framework adapter wraps the minimum viable server or client implementation and exposes idiomatic APIs for a specific framework.

### Structure

```
packages/your-adapter/
├── src/
│   ├── index.ts         # public API
│   └── streaming.ts     # RAIS SSE handling
├── package.json         # peer dep on the framework
└── README.md
```

### What makes a good adapter

- **Thin**: The adapter should not re-implement RAIS logic. Import `@react-ai-stream/core` or write a 30-line SSE handler. Do not add a third version.
- **Idiomatic**: Use the conventions of the target framework. If the framework has a middleware pattern, use it. If it has a composable pattern, use that.
- **Typed**: Full TypeScript types for the public API. If you are writing in Go or Python, use that language's type system.
- **Tested**: At minimum, a test that starts a real server, sends a real request, and asserts the SSE response matches RAIS v1 format.

### Reusing core logic

If you are writing a TypeScript adapter, you can import the SSE parser and normalizer from `@react-ai-stream/core`:

```typescript
import { parseSSE, normalizeCustomChunk } from '@react-ai-stream/core'
```

If you are writing in another language, implement the SSE parsing directly — it is 30 lines, and the spec is the authoritative reference.

---

## Claiming compliance

1. Run `npx rais-compliance <your-endpoint>` and capture the output
2. Add the compliance badge to your README (the CLI prints it on success)
3. Open a pull request to [`rais-spec/COMPATIBILITY.md`](COMPATIBILITY.md) to add your implementation to the matrix

```markdown
| Your language | Your framework | your-package | ✅ | ✅/❌ | ✅ | Stable/Beta |
```

Include a link to your repository in the PR description.

---

## Naming conventions

Community adapters are welcome to use any name. To make them discoverable:

- npm packages: `rais-<framework>` or `@your-org/rais-<framework>` (e.g. `rais-hono`, `rais-solid`)
- PyPI packages: `rais-<framework>` (e.g. `rais-django`)
- Go modules: `github.com/you/rais-<framework>`

The `@react-ai-stream/` npm scope and `react-ai-stream` GitHub repo are reserved for official implementations maintained in this monorepo.

---

## Getting help

- Open an issue with the `adapter-help` label for implementation questions
- See [`rfcs/`](../rfcs/) if you want to propose a protocol extension that your adapter needs
- See [`rais-spec/PRINCIPLES.md`](PRINCIPLES.md) if you are unsure about a design decision
