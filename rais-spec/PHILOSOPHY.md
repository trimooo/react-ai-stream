# Why RAIS Exists

---

## The problem it solves

Every AI application that streams responses from a language model faces the same plumbing problem: how does a chunk of generated text get from the model to the user's screen, incrementally, in real time?

The answer seems obvious: Server-Sent Events, or a WebSocket. Stream the tokens as they arrive. Show them to the user.

What is not obvious is that every team solving this problem solves it differently. The OpenAI SDK uses one format. The Anthropic SDK uses another. Vercel AI SDK wraps both in a third format. LangChain streams in yet another. Most teams end up with bespoke parsing logic tied to the specific provider they chose when they started the project.

The result is a fragmented landscape where:

- Frontend code is tightly coupled to one provider's event format
- Switching providers requires changing UI code, not just server code
- Different teams solving the same problem cannot share tooling, components, or debugging infrastructure
- Every new AI framework re-invents the same streaming wire format

RAIS exists to establish a common format. Not a new one built from scratch — a minimal formalization of what a well-designed streaming layer already looks like.

---

## Why provider lock-in at the wire level is dangerous

Most developers understand the risk of provider lock-in at the SDK level: if you import `@anthropic-ai/sdk` directly in your frontend, switching to OpenAI means changing your frontend code.

What fewer developers notice is that lock-in at the *wire format* level is worse.

When your frontend parses `content_block_delta` events from Anthropic's SSE stream directly, you have not just coupled your frontend to one SDK — you have coupled it to one provider's *wire format decisions*. Anthropic can change that format (and has). Your frontend breaks.

The right abstraction is a thin normalization layer at the server: your server speaks RAIS; your frontend speaks RAIS; neither knows which LLM is behind the endpoint. The server is the only thing that knows, and the server is the right place for that knowledge to live.

This is the same architectural pattern that made JDBC work for databases, or how HTTP abstracted the transport layer. The insight is not new. It just has not been applied to AI streaming until now.

---

## Why AI streaming fragmentation is accelerating

The AI ecosystem is moving faster than any previous infrastructure layer. New models, new providers, new modalities, new capabilities — every few months. This pace creates fragmentation pressure.

Each new provider introduces a new SSE format. Each new capability (function calling, extended thinking, multimodal) introduces new event types. Each new framework (Next.js App Router, Hono, Astro server actions) introduces a new way to set up the streaming route.

Without a shared format, the cost of this fragmentation is paid by every developer building every AI application. They absorb the churn. Their codebases become mixtures of provider-specific parsing code, framework-specific route patterns, and half-abstracted wrappers that never quite generalize.

With a shared format, the cost of provider and framework changes is paid once by adapter maintainers. Application developers do not feel it.

---

## Why transport standards matter

Protocols feel abstract until they fail. When they work, they are invisible infrastructure — the thing that lets unrelated systems interoperate without coordination.

HTTP is why a browser written in C++ can load a page from a server written in Rust without either knowing about the other. OpenAPI is why an iOS app and a web dashboard can both consume the same REST API without duplicating the contract. RAIS's ambition is more modest: let any AI backend talk to any streaming frontend, regardless of which language wrote each side.

That ambition is achievable with three event types. The simplicity is not a limitation — it is the point.

A standard that requires 50 lines to implement in a new language will see many implementations. A standard that requires 500 lines will see a few. A standard that requires tight coupling to a specific runtime will see one. RAIS chose 50 lines.

---

## Why frontend frameworks should not own protocols

One of the more subtle decisions embedded in RAIS's design is that the protocol lives below the framework layer.

The alternative — a streaming format defined by and for a specific framework (Next.js, Remix, SvelteKit) — is tempting because it enables tight integration. But it also means:

- The protocol evolves at the framework's pace, not the protocol's
- Switching frameworks means re-building streaming from scratch
- Server implementations in other languages must target the framework's expectations instead of a neutral spec
- The "standard" is controlled by whoever controls the framework

RAIS is defined at the HTTP layer, not the framework layer. Any framework can implement it. Any framework can consume it. The framework adapter is a thin wrapper, not the protocol itself.

---

## Why additive evolution matters

Protocols age poorly when they break compatibility. The upgrade treadmill — where every new version forces simultaneous updates to every client and server — is a strong force against adoption. Teams that have been burned once by a breaking protocol change become conservative adopters of the next one.

RAIS v1 is designed to never break. Not "probably won't break" — never. The design principle is: v1 streams produced today will be consumed correctly by v10 clients in ten years.

This is achievable because:

1. Unknown event types are silently ignored (clients are already required to do this)
2. New fields are always optional
3. New capabilities arrive as new event types, not modifications to existing ones
4. The complexity budget for the core protocol is fixed at three event types

The cost of this constraint is that some things take longer to standardize. That cost is worth paying. Predictability is not a conservative position — it is the foundation that lets the ecosystem grow.

---

## What RAIS is not

RAIS is not an agent framework. It does not define how tools are invoked, how memory is managed, how retrieval works, or how multi-step workflows are orchestrated. Those are application concerns, and there are good libraries for them.

RAIS is not a UI framework. It does not define how messages are displayed, how input is handled, or how conversations are structured visually.

RAIS is not a provider SDK. It does not abstract the OpenAI or Anthropic APIs. It defines what your server emits after it has talked to those APIs.

RAIS is the single thin layer between "my server talked to an LLM" and "my frontend showed the user the response, token by token." That layer should be standardized. Everything else can be whatever it needs to be.

---

## The outcome we're working toward

The strongest version of this future is one where:

- A developer building a support chat widget in React can swap their backend from Python to Go without touching their frontend code
- A developer building a Vue dashboard can use the same streaming infrastructure as their colleague building a React mobile app
- A new AI provider can ship a RAIS-compliant endpoint and immediately work with every RAIS client in existence
- Framework authors, server authors, and client authors can work independently, with compliance tests as the shared contract

That is a future where AI streaming is solved infrastructure, not repeated plumbing. RAIS is the attempt to get there.
