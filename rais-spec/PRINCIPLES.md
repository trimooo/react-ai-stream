# RAIS Design Principles

These principles govern how the RAIS Protocol evolves. They are not rules to follow mechanically — they are the *reasons behind* the rules. When a proposed change creates tension between principles, this document is the starting point for that discussion.

---

## 1. Additive-first

Every new capability must be expressible as an addition, not a change. If a proposed feature requires modifying the semantics of an existing event type, that is a design failure to be solved before the feature ships, not a reason to make a breaking change.

*Why:* Implementations that work today must work forever. The cost of a surprise breaking change — cascading upgrades, broken integrations, lost trust — is permanent. The cost of a more constrained design process is temporary.

*In practice:* Prefer new event types over new required fields. Prefer optional fields over required ones. Prefer server-optional features over mandatory client behavior.

---

## 2. Transport-agnostic

The RAIS event model must be expressible over any transport that supports ordered message delivery. SSE is the default. WebSocket is the optional extension. Future transports (HTTP/3 push, long-poll fallback) must not require protocol changes.

*Why:* Coupling the protocol semantics to a specific transport creates lock-in exactly where it hurts most: infrastructure. A developer who can only use WebSocket should be able to use RAIS.

*In practice:* New event types must be definable purely as JSON — no assumptions about SSE-specific fields like `id:`, `event:`, or `retry:` in the core event semantics.

---

## 3. Human-readable wire format

The wire format must be readable without tooling. A developer should be able to `curl -N` a RAIS endpoint and understand what is happening by reading the output.

*Why:* Debuggability is a feature. Opaque binary formats and compressed envelopes shift debugging from "read the output" to "install the right tool." This is a recurring source of adoption friction in infrastructure protocols.

*In practice:* JSON. Plain text. No base64 inside event payloads unless the data itself is binary and there is no alternative.

---

## 4. Graceful degradation

A v1 client receiving a v2 stream must function correctly on the content it understands, silently ignoring what it does not. A v2 server serving a v1 client must produce valid v1 output.

*Why:* Ecosystems do not upgrade in lockstep. At any moment, some clients are ahead of some servers. A protocol that breaks on version mismatch creates permanent deployment anxiety.

*In practice:* Unrecognized event types are silently ignored (already normative in SPEC.md §8). New required fields may only be added in major versions, and only after a deprecation period. Optional fields may be added freely.

---

## 5. Implementation-light

A minimal RAIS-compliant server must be expressible in under 50 lines of code in any language with HTTP support. A minimal RAIS-compliant client must be expressible in under 30 lines.

*Why:* Protocols with high implementation weight accumulate fewer third-party implementations. Every line of required boilerplate is a tax on every new adapter. The existing spec Appendices A, B, and C demonstrate what "implementation-light" means in practice.

*In practice:* Any proposed feature that significantly raises the minimum implementation weight requires explicit justification before acceptance. Complexity should be opt-in, not mandatory.

---

## 6. Framework-independent

RAIS must be implementable in any language or framework without depending on any SDK produced by this project. The spec must be self-contained. No normative reference to any JavaScript, Python, or framework-specific concept.

*Why:* The protocol's legitimacy comes from its independence from any one implementation. A Go developer should be able to implement RAIS by reading SPEC.md alone, without reading any JavaScript.

*In practice:* Specs reference HTTP, JSON, and RFC standards. They do not reference npm packages, Python modules, or React lifecycle methods. Example code in appendices is illustrative, not normative.

---

## 7. Abort propagation is mandatory

Stream cancellation is a first-class protocol concern, not an optional nicety. Servers MUST handle abort. Clients MUST use AbortController. This is not negotiable.

*Why:* AI token generation is computationally expensive. Every un-cancelled in-flight stream burns real money. More importantly, implementations that cannot reliably cancel streams leak resources in production. Abort propagation being "recommended" instead of "required" has caused real incidents in other streaming ecosystems.

*In practice:* Any proposed feature that introduces a new streaming operation must include abort semantics as part of its design, before it can be accepted.

---

## 8. Clarity over completeness

RAIS does not need to model every possible AI interaction. It needs to model the common case well. Agent loops, multi-modal outputs, vector retrieval, orchestration — these are application concerns, not protocol concerns.

*Why:* The strength of RAIS is that the entire normative spec fits on one page and can be understood in one sitting. That is rare. Every feature that adds to the protocol's surface area is a cost paid by every future implementer, permanently.

*In practice:* When a feature can be expressed in application code without protocol changes, the protocol should not be extended. When a feature cannot — when it requires coordination between client and server at the wire level — that is the bar for an RFC.

---

## Tension and trade-offs

These principles sometimes conflict. A few predictable tensions:

**Additive-first vs. clarity over completeness** — the cleanest additive extension may still add too much surface area. Both principles apply. The RFC process is where these are resolved.

**Human-readable vs. implementation-light** — a maximally readable format may require more parsing code. JSON with `\n\n` framing is the current balance point. Binary alternatives must clear a very high bar.

**Transport-agnostic vs. abort semantics** — different transports cancel differently (AbortController vs. WS close code 1000 vs. long-poll abandonment). The principle that both serve is: abort must always be possible and must propagate.

When in doubt, ask: *does this change make RAIS harder to implement from scratch in a new language?* If yes, that is a strong signal to find a simpler design.
