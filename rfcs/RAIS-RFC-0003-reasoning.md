# RAIS-RFC-0003: Reasoning / Thinking Events

- **Number:** 0003
- **Title:** Reasoning / Thinking Events
- **Status:** Draft
- **Author:** trimooo (GitHub: @trimooo)
- **Created:** 2026-05-14
- **Target version:** RAIS v2.0

---

## Summary

Add a `reasoning` event type that allows servers to stream extended thinking / chain-of-thought tokens from reasoning models (Claude 3.7+ extended thinking, OpenAI o1/o3, DeepSeek R1) separately from the final `text` response. Clients can choose to display or hide these tokens.

---

## Motivation

Reasoning models produce two distinct streams:

1. **Thinking tokens** — the model's internal chain-of-thought. Verbose, intermediate, not the final answer.
2. **Response tokens** — the final answer, derived from the thinking.

Currently, RAIS clients receive both as undifferentiated `text` events if the server forwards both, or only the response if the server strips thinking. Neither is ideal:

- If thinking tokens are forwarded as `text`, the client cannot distinguish "intermediate reasoning" from "final response" — the UI looks wrong
- If thinking tokens are stripped, developers lose valuable debugging information and power users lose transparency into model behavior

The `reasoning` event enables:

- **Separate rendering**: Show a collapsible "Thinking…" section with `reasoning` events, then the clean response with `text` events
- **Transparency**: Users of reasoning-heavy tasks (code, math, analysis) can audit the model's logic
- **Developer tooling**: DevTools can show reasoning token count and timing separately from response tokens
- **Progressive disclosure**: Default to hidden, expandable on demand

---

## Detailed design

### Wire format

```json
{
  "type": "reasoning",
  "text": "Let me break this problem down. First, I need to..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"reasoning"` | yes | Discriminant |
| `text` | `string` | yes | A chunk of reasoning/thinking text. Clients MUST append in order. |

The `text` field mirrors the `text` event's field intentionally — clients that want to treat reasoning as regular text can use the same rendering path with a different style.

### Event sequencing

Reasoning events appear **before** response text events, reflecting the model's internal process:

```
data: {"type":"reasoning","text":"The user is asking about..."}

data: {"type":"reasoning","text":" I should consider..."}

data: {"type":"text","text":"Based on my analysis, the answer is..."}

data: {"type":"text","text":" 42."}

data: {"type":"done"}
```

Rules:
- `reasoning` events SHOULD appear before any `text` events in a stream (matching model behavior)
- `reasoning` events MAY be interleaved with `text` events if the model architecture requires it
- `reasoning` events MUST NOT appear after `done` or `error`
- A stream MAY contain only `reasoning` events with no `text` events (edge case: model thinks but produces no response)

### Client behavior

- Clients MUST silently ignore `reasoning` events if they do not render them (v1 compatibility)
- Clients that render `reasoning` SHOULD visually distinguish it from `text` — it is not the final response
- Clients SHOULD collapse `reasoning` sections by default to avoid overwhelming users
- Clients MUST accumulate `reasoning` tokens in order, separate from the `text` accumulator
- Clients SHOULD expose `onReasoning` callback for the same use cases as `onToken`

### Server behavior

- Servers MUST only emit `reasoning` events when the model explicitly signals extended thinking mode
- Servers MUST NOT fabricate reasoning tokens that were not produced by the model
- Servers SHOULD strip thinking tokens and use regular `text` events unless the client has opted in or the server is configured to forward them

---

## Backward compatibility

### Existing v1 clients

v1 clients silently ignore `reasoning` events (SPEC.md §8). A stream with `reasoning` events followed by `text` events will render correctly on a v1 client — the thinking is invisible, the response appears normally. This is the correct degraded experience.

### Existing v1 servers

v1 servers never emit `reasoning`. No migration required. Servers that use reasoning models simply continue forwarding only the response text as regular `text` events.

---

## SDK impact

The React hook would need a new `onReasoning` callback and a `reasoning` field in the return value:

```ts
// Proposed hook API addition
const {
  messages,
  reasoning,    // string — accumulated reasoning text (clears on new message)
  sendMessage,
  ...
} = useAIChat({
  endpoint: '/api/chat',
  onReasoning: (chunk) => console.log('thinking:', chunk),
})
```

This is additive — existing hook consumers are unaffected.

---

## Alternatives considered

### Embed reasoning in `text` events with a flag

`{"type":"text","text":"...","reasoning":true}` — reuses the existing event type with a boolean flag. Rejected because it conflates two semantically distinct streams and requires clients that do care about the distinction to branch on every `text` event.

### Separate endpoint for reasoning

The server could offer `/api/chat?thinking=true` that produces reasoning events, and `/api/chat` that strips them. Rejected because it adds routing complexity and prevents clients from dynamically choosing whether to display thinking without changing their endpoint configuration.

### Block-level reasoning (emit full thinking block at once)

Instead of streaming reasoning tokens, emit a single `reasoning` event with the complete thinking text after it finishes. Rejected because it delays the UI — users would see nothing for the entire thinking period, then a large block appears. Streaming maintains perceived responsiveness.

---

## Security considerations

- Reasoning tokens may contain sensitive model internals or prompt information that was not intended for the client. Servers SHOULD audit what thinking tokens reveal before forwarding them to clients.
- Some providers consider thinking tokens to be confidential model internals. Check your provider's terms before forwarding reasoning tokens to end users.

---

## Open questions

1. Should `reasoning` tokens be included in the `tokens.output` count in RFC-0002's `metadata` event? Or should they have a separate `tokens.reasoning` count? This affects cost transparency.
2. Should there be a way for the client to signal to the server that it supports `reasoning` events? (e.g., a request header `RAIS-Features: reasoning`) Or is the server's configuration sufficient?
3. How should multi-turn conversations handle reasoning? Should reasoning from previous turns be included in context, or stripped before subsequent requests?

---

## References

- [Anthropic extended thinking guide](https://docs.anthropic.com/claude/docs/extended-thinking)
- [OpenAI o1 reasoning summary](https://platform.openai.com/docs/guides/reasoning)
- RAIS Protocol v1 §9 (reserved event types — `reasoning` is explicitly reserved)
- RAIS-RFC-0002 (metadata — interaction with `tokens.reasoning` count)
