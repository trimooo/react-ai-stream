# RAIS-RFC-0001: Tool Call Events

- **Number:** 0001
- **Title:** Tool Call Events
- **Status:** Draft
- **Author:** trimooo (GitHub: @trimooo)
- **Created:** 2026-05-14
- **Target version:** RAIS v2.0

---

## Summary

Add a `tool_call` event type to the RAIS Protocol that allows servers to signal LLM-initiated tool invocations to clients. This enables clients to render intermediate tool-call state (e.g. "searching the web…") and to optionally participate in the tool execution loop.

---

## Motivation

Modern LLMs (GPT-4o, Claude 3.5+, Gemini 1.5+) support function calling / tool use. When a model decides to call a tool mid-response, there is currently no way to surface that event to a RAIS client. The client either sees nothing until the tool result arrives, or receives the raw text of a JSON tool call blob.

This proposal enables:

- **Streaming UI feedback**: "Searching Wikipedia…", "Running code…", spinner with tool name
- **Client-side tool execution**: Client runs the tool and sends the result back (agentic flows)
- **Observability**: DevTools and compliance tools can log tool call events with timing

---

## Detailed design

### Wire format

#### `tool_call` — LLM initiated a tool call

```json
{
  "type": "tool_call",
  "id": "call_abc123",
  "tool": "web_search",
  "input": { "query": "RAIS protocol streaming" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"tool_call"` | yes | Discriminant |
| `id` | `string` | yes | Unique identifier for this tool call within the stream. Used to correlate with future `tool_result` events. |
| `tool` | `string` | yes | Tool name as defined in the server's tool schema. |
| `input` | `object` | yes | Tool input arguments. Shape is tool-defined. |

#### `tool_result` — Tool execution completed

```json
{
  "type": "tool_result",
  "id": "call_abc123",
  "output": { "results": ["..."] }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"tool_result"` | yes | Discriminant |
| `id` | `string` | yes | Matches the `id` from the corresponding `tool_call`. |
| `output` | `object \| string` | yes | Tool output. Shape is tool-defined. May be a string for simple text results. |
| `error` | `string` | no | If the tool failed, a human-readable error message. |

### Event sequencing

A stream with a tool call looks like:

```
data: {"type":"text","text":"Let me search for that."}

data: {"type":"tool_call","id":"call_1","tool":"web_search","input":{"query":"..."}}

data: {"type":"tool_result","id":"call_1","output":{"results":["..."]}}

data: {"type":"text","text":"Based on the results, ..."}

data: {"type":"done"}
```

Rules:
- `tool_call` MAY appear at any point in a stream, including before any `text` event
- `tool_result` MUST follow its corresponding `tool_call`
- Multiple tool calls MAY be in-flight simultaneously (parallel tool use)
- `tool_call` and `tool_result` MUST NOT appear after `done` or `error`

### Client behavior

- Clients MUST silently ignore `tool_call` and `tool_result` events if they do not understand them (v1 compatibility requirement already covers this)
- Clients that render tool events SHOULD display the `tool` name and a loading indicator between `tool_call` and its corresponding `tool_result`
- Clients SHOULD NOT display raw `input`/`output` JSON to end users by default — these may be verbose

### Server behavior

- Servers that emit `tool_call` SHOULD also emit `tool_result` when the tool completes
- Servers MUST emit `tool_call` before any `text` tokens that depend on the tool result
- Servers SHOULD NOT emit partial tool call events (the full `input` must be available when `tool_call` is emitted)

---

## Backward compatibility

### Existing v1 clients

v1 clients already MUST silently ignore unrecognized event types (SPEC.md §8). A v1 client receiving a stream with `tool_call` and `tool_result` events will silently skip them and render only the `text` content. This is correct behavior — the text content in a tool-augmented stream should be complete without the tool events.

### Existing v1 servers

v1 servers MUST NOT emit `tool_call` or `tool_result` today (SPEC.md §8). Once this RFC is accepted and RAIS v2 ships, servers that want to adopt tool calling update their RAIS version claim to v2.

### Migration path

No migration required for existing v1 implementations. Tool call support is purely additive. A v2 server can serve both v1 and v2 clients: v1 clients ignore the tool events, v2 clients render them.

---

## Alternatives considered

### Embed tool calls in `text` events

The simplest approach: just stream tool call JSON as text tokens. Rejected because it conflates the display text with protocol metadata, makes it impossible to distinguish tool events from content, and forces clients to parse LLM-specific formats.

### Single `tool_call` event with result embedded

`{"type":"tool_call","id":"...","tool":"...","input":{...},"output":{...}}` — sent only after the tool completes. Rejected because it prevents clients from showing real-time feedback that the tool is running. A visible "searching…" spinner between `tool_call` and `tool_result` is a significant UX improvement.

### Client-side tool execution (client sends tool results back)

An alternative design where the server sends `tool_call` and the client sends `tool_result` back over a second request or WebSocket message. Deferred to a later RFC — this is a significant protocol expansion that introduces request/response cycles and is better handled separately.

---

## Security considerations

- `input` and `output` fields may contain sensitive data (user PII, API responses). Servers SHOULD sanitize these before emitting `tool_result` if the output contains data not intended for the client.
- Tool names MUST NOT be treated as executable code by clients. The `tool` field is a display string only.
- The `id` field should be opaque to clients — do not use it as a security token.

---

## Open questions

1. Should `tool_result` be optional if the server handles tool execution internally and the client never needs the output? The current design requires it for correlation — but a `silent: true` flag on `tool_call` could suppress `tool_result` for server-side-only tools.
2. Should streaming tool inputs be supported for large payloads? (Similar to how `text` streams token by token.) This would require a `tool_call_delta` event type, which adds complexity.
3. Should there be a maximum nesting depth for parallel tool calls? (e.g., can a tool result trigger another tool call?)

---

## References

- [OpenAI function calling spec](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic tool use guide](https://docs.anthropic.com/claude/docs/tool-use)
- RAIS Protocol v1 §9 (reserved event types)
