# RAIS Protocol v1 Stability Guarantee

**RAIS v1 is frozen. This guarantee is permanent.**

---

## What "stable" means

A RAIS v1 server deployed today will work with every RAIS client built today, next year, and in future major versions of this protocol. No breaking changes will be made to RAIS v1.

Specifically:

- The three event types (`text`, `done`, `error`) and their fields are finalized.
- The SSE transport framing (`data: <JSON>\n\n`) is finalized.
- The WebSocket transport (optional, v1 extension) is finalized.
- The abort semantics are finalized.
- The reconnect behavior spec is finalized.

If you implement RAIS v1 today, you will never need to update your implementation because of a protocol change.

---

## What "additive-only" means

Future protocol versions add new optional capabilities. They do not change what already exists.

| Change type | Version | Example |
|-------------|---------|---------|
| New event type (optional) | Minor (v1.1) | `metadata` event |
| New optional field on existing event | Minor (v1.1) | `done` gains optional `model` field |
| New required field on existing event | **Major (v2)** — breaking change | Would only happen with long deprecation period |
| Changed semantics for existing event | **Major (v2)** — breaking change | Would only happen with long deprecation period |
| New transport variant | Minor (v1.1) | HTTP/3 variant |

RAIS v2, when it exists, will be a superset of v1. A v2 client will accept v1 streams. A v1 client will function correctly on a v2 server that sends no v2-only events.

---

## The compatibility matrix

Any combination of these works now and will work in future versions:

| Server | Client | Result |
|--------|--------|--------|
| RAIS v1 | RAIS v1 | ✅ Fully compatible |
| RAIS v1 | RAIS v2 (future) | ✅ v2 clients ignore unknown events |
| RAIS v2 (future) | RAIS v1 | ✅ v2 servers remain v1-compatible |

This is guaranteed by the additive-only evolution policy and by the client requirement to silently ignore unrecognized event types (see [SPEC.md §8](SPEC.md#8-unrecognized-event-types)).

---

## What is NOT covered by this guarantee

- The `@react-ai-stream/*` npm package APIs (governed by their own semver)
- The `rais` Python package API (governed by its own semver)
- Internal implementation details of any SDK
- The compliance test suite pass/fail behavior (new tests may be added)

---

## Why this matters

Infrastructure ecosystems are built on predictability. Developers building on RAIS should never have to worry about the protocol changing under them. The cost of a surprise breaking change — broken integrations, lost trust, migration fatigue — far exceeds the benefit of any individual protocol improvement.

This guarantee exists so that:

- Framework authors can confidently build RAIS adapters
- Companies can adopt RAIS in production without protocol risk
- The community can build tooling knowing the target won't move

---

## Version signaling

The protocol version is communicated out-of-band (documentation, package versions, this repo). There is no version negotiation in the wire format — this is intentional. Version negotiation adds complexity and round-trips; additive evolution makes it unnecessary.

When RAIS v2 exists, it will have its own spec file (`SPEC-v2.md`) alongside this one. SPEC.md will always refer to the latest stable minor version of the current major version.

---

## Reporting compatibility issues

If you discover a situation where a RAIS v1-compliant implementation is incompatible with another v1-compliant implementation, open an issue with the `compatibility-bug` label. This is a spec defect and will be addressed with an errata.

Errata are additive clarifications — they do not change behavior for already-working implementations.
