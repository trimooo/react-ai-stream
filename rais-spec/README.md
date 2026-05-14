# RAIS Protocol

**RAIS** (React AI Stream) is an open wire protocol for streaming AI responses over HTTP. It is intentionally minimal: three event types, one transport (SSE), and an optional WebSocket variant.

## Why a standalone spec?

Protocols outlive libraries. By formalizing RAIS as an independent, versioned specification — separate from any implementation — we make it possible for:

- Go, Python, Ruby, and Java server authors to implement RAIS without depending on this repository
- Client authors in Svelte, Solid, Angular, and native apps to consume RAIS streams
- A compliance test suite to certify any implementation
- The community to propose extensions without a library PR gating the discussion

## Documents

| File | Contents |
|------|----------|
| [`SPEC.md`](SPEC.md) | Normative specification — transport, wire format, event semantics, abort, reconnect |
| [`STABILITY.md`](STABILITY.md) | Stability guarantee — v1 is frozen, backward compatibility promise |
| [`VISION.md`](VISION.md) | Long-term vision — the outcome the ecosystem is working toward |
| [`PRINCIPLES.md`](PRINCIPLES.md) | Design principles — the reasoning behind the spec, governs evolution |
| [`PHILOSOPHY.md`](PHILOSOPHY.md) | Why RAIS exists — the manifesto, motivation |
| [`IMPLEMENTING.md`](IMPLEMENTING.md) | Guide for building third-party servers, clients, and adapters |
| [`INTEROP.md`](INTEROP.md) | Cross-language interoperability test matrix and scenario coverage |
| [`ECOSYSTEM.md`](ECOSYSTEM.md) | Registry of all known RAIS implementations, adapters, and examples |
| [`COMPLIANCE.md`](COMPLIANCE.md) | Pass/fail compliance checklist, certification levels, and badges |
| [`COMPATIBILITY.md`](COMPATIBILITY.md) | Language and framework implementation matrix |
| [`CHANGELOG.md`](CHANGELOG.md) | Protocol version history |

See [`rfcs/`](../rfcs/) for proposed protocol extensions and the RFC process.

## Current version

**RAIS v1.0** — frozen and stable. Backward compatibility is guaranteed. See [`STABILITY.md`](STABILITY.md) for the full guarantee.

## Compliance badges

After running `npx rais-compliance <endpoint>`, add your certification level to your README:

| Level | Badge |
|-------|-------|
| Core | ![RAIS v1 Core](https://img.shields.io/badge/RAIS-v1%20Core-3b82f6) |
| Recommended | ![RAIS v1 Recommended](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e) |
| Full | ![RAIS v1 Full](https://img.shields.io/badge/RAIS-v1%20Full-7c3aed) |

## Quick reference

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"text","text":"Hello"}\n\n
data: {"type":"text","text":" world"}\n\n
data: {"type":"done"}\n\n
```

Three event types:

| Type | Payload | Meaning |
|------|---------|---------|
| `text` | `{"type":"text","text":"..."}` | Append token to current assistant message |
| `done` | `{"type":"done"}` | Stream complete — close connection |
| `error` | `{"type":"error","error":"..."}` | Unrecoverable failure — surface to user |

## Reference implementations

| Language | Package | Status |
|----------|---------|--------|
| TypeScript / React | [`@react-ai-stream/core`](../packages/core) + [`@react-ai-stream/react`](../packages/react) | Stable, published |
| TypeScript / Vue 3 | [`@react-ai-stream/vue`](../packages/vue) | Stable |
| TypeScript / Express | [`@react-ai-stream/express`](../packages/express) | Stable |
| Python | [`rais`](../packages/python-rais) | Stable |

## Contributing

Corrections, clarifications, and language compatibility reports are welcome. Protocol extensions (new event types) go through a proposal process — open an issue with the `rais-extension` label.
