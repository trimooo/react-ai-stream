# RAIS Long-Term Vision

This document describes where the RAIS Protocol ecosystem is working toward. It is not a roadmap (timelines, specific features) — it is a direction. Roadmaps change. Direction should be stable.

---

## The core outcome

**AI streaming becomes solved infrastructure.**

Today, every team building an AI application re-solves the same problem: how do we get tokens from a language model to a user's screen, incrementally, reliably, across every frontend and backend they use? They solve it in isolation, with different wire formats, different abort behaviors, different error handling. The solutions are not composable.

The outcome we are working toward: streaming AI responses is a solved, interoperable layer. A developer building a React dashboard, a Vue mobile app, a Go CLI, and a Python data tool uses the same protocol for all of them. They switch LLM providers without touching their frontend. They debug with standard tooling. They trust the layer because thousands of other production systems trust it.

That is not a product vision. It is an infrastructure outcome. The difference matters.

---

## Interoperable AI streaming

The strongest version of this future: any RAIS-compliant server works with any RAIS-compliant client, regardless of which language wrote either.

- A Python FastAPI server works with a React hook without any React-specific code on the server
- A Go server works with a Svelte composable without any Go-specific code on the client
- A new AI provider ships a RAIS endpoint and immediately works with every RAIS client in existence — before any adapter is written

This is achievable because the protocol is minimal and formally specified. It is not achievable if the protocol accumulates complexity or vendor-specific extensions.

---

## Provider portability

Developers should be able to switch LLM providers — or run multiple providers simultaneously — without touching their frontend code.

This means:
- No provider-specific event types in the RAIS core spec
- No provider-specific fields required by clients
- Provider capabilities surfaced through optional fields, never required ones

The `rais[openai]`, `rais[anthropic]`, `rais[groq]` pattern on the server side is the right model: the server knows which provider it talks to; the client never needs to know.

---

## Framework independence

RAIS should work in every JavaScript framework, every backend language, and every runtime environment. Framework-specific implementations are welcome; framework-specific protocol behavior is not.

This means:
- The core spec references only HTTP, SSE, and JSON
- Framework adapters are thin wrappers, not protocol forks
- A RAIS implementation in Go or Rust is a first-class implementation, not a port

The measure of success here: a Rust developer can implement a RAIS-compliant server by reading SPEC.md alone.

---

## Transport resilience

SSE is the right default transport for most use cases — it is simple, widely supported, and works through proxies and firewalls that WebSocket does not. But SSE is not always available.

Long-term, RAIS should be expressible over:
- Server-Sent Events (current default)
- WebSocket (current optional extension)
- HTTP/2 server push (future)
- Long-poll fallback (future)

The event semantics are transport-independent. The same `text` / `done` / `error` model works over any ordered message channel. Transport-specific behavior (reconnect, framing, close codes) is documented separately per transport.

---

## Implementation diversity

A protocol is only real when independent authors implement it independently and get compatible results.

The ecosystem is working toward:
- Official implementations in TypeScript (React, Vue), Python, and eventually Go
- Community implementations in Svelte, Solid, Rust, Ruby, Java, and PHP
- Each implementation passing the same compliance test suite
- No implementation requiring knowledge of any other implementation

Implementation diversity is both a validation signal (the spec is clear enough that independent authors produce compatible results) and a resilience mechanism (the ecosystem does not depend on any one maintainer).

---

## Graceful degradation across versions

RAIS v1 clients must always work with RAIS v2+ servers, and vice versa. This is not a soft goal — it is a hard requirement.

Long-term this means:
- Protocol extensions are additive, not modifications
- Version negotiation is not needed (and should never be needed)
- The complexity budget for the core protocol is treated as fixed

Future capabilities — tool calls, stream metadata, reasoning tokens — arrive as new optional event types that v1 clients silently ignore. The v1 core is the stable foundation everything else is built on.

---

## What this vision explicitly excludes

**Agent protocols.** Tool invocation, memory, retrieval, multi-step reasoning, orchestration — these are application concerns. RAIS may add a `tool_call` event for surfacing tool-use to clients (RFC-0001), but RAIS is not an agent framework and will not become one.

**Binary or compressed formats.** Human-readable wire format is a principle, not a preference. It enables debugging without tooling, which is worth its cost in throughput.

**Provider-specific extensions.** No vendor-specific fields in the core spec. Provider capabilities surface through optional metadata or through application-layer conventions.

**Tight framework coupling.** No normative references to React, Next.js, or any specific runtime in SPEC.md.

**Negotiation layers.** No capabilities handshake, no version field in the wire format, no feature flags in the request. Additive evolution makes these unnecessary.

---

## How to contribute to this vision

The most impactful contributions, in rough order:

1. **Build an independent implementation** — write a RAIS-compliant server or client in a language not yet covered. Pass the compliance tests. Add yourself to ECOSYSTEM.md.

2. **Use RAIS in production** — build a real application. File issues when the protocol creates friction. That friction is the signal that guides evolution.

3. **Write about it** — technical deep-dives on SSE internals, abort propagation, streaming UI patterns. Protocol ecosystems grow through understanding, not marketing.

4. **Propose extensions thoughtfully** — if you need something the protocol doesn't support, open an RFC. Write the wire format, the backward compat analysis, the alternatives considered. The RFC template exists to make this tractable.

5. **Review RFCs** — comment on open RFCs with concrete feedback. The design questions listed in each RFC are real questions. Answers from experienced engineers in different language ecosystems are more valuable than answers from the protocol author.

---

## What success looks like

Not by metrics. By behavior:

- An engineer at a company that has never heard of this project starts a new AI feature, finds RAIS through a search or recommendation, reads the spec in an hour, and builds a compliant server that works on the first try with `npx rais-compliance`
- A Rust library author implements RAIS over WebSocket, opens a PR to COMPATIBILITY.md, and their implementation works with the official React hook without any coordination between the authors
- The RAIS spec is cited in a blog post or technical talk by someone who has no connection to this project

Those are the signs that the protocol has gravity. They are not things you can build toward directly — they emerge from the accumulation of clarity, stability, and useful implementations.
