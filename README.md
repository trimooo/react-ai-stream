<div align="center">
  <img src="assets/logo.svg" width="72" height="72" alt="react-ai-stream" />
</div>

# react-ai-stream — Developer Guide

[![CI](https://github.com/trimooo/react-ai-stream/actions/workflows/ci.yml/badge.svg)](https://github.com/trimooo/react-ai-stream/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@react-ai-stream/core?label=%40react-ai-stream%2Fcore)](https://www.npmjs.com/package/@react-ai-stream/core)
[![npm](https://img.shields.io/npm/v/@react-ai-stream/react?label=%40react-ai-stream%2Freact)](https://www.npmjs.com/package/@react-ai-stream/react)
[![npm](https://img.shields.io/npm/v/@react-ai-stream/ui?label=%40react-ai-stream%2Fui)](https://www.npmjs.com/package/@react-ai-stream/ui)
[![npm](https://img.shields.io/npm/v/@react-ai-stream/vue?label=%40react-ai-stream%2Fvue)](https://www.npmjs.com/package/@react-ai-stream/vue)
[![npm](https://img.shields.io/npm/v/@react-ai-stream/express?label=%40react-ai-stream%2Fexpress)](https://www.npmjs.com/package/@react-ai-stream/express)
[![RAIS v1](https://img.shields.io/badge/RAIS-v1%20Stable-22c55e)](rais-spec/COMPLIANCE.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Universal AI streaming infrastructure.** One open protocol. Any server. Any frontend.

> This README is the complete developer reference for the monorepo. It covers every file, every command, every environment variable, and how all the pieces connect. For the public-facing product docs, visit [react-ai-stream-docs.vercel.app](https://react-ai-stream-docs.vercel.app/).

---

## Table of Contents

- [What Is This?](#what-is-this)
- [Quick Setup](#quick-setup)
- [Port Map](#port-map)
- [Monorepo Structure — Every File](#monorepo-structure--every-file)
- [Environment Variables — Complete Reference](#environment-variables--complete-reference)
- [Running Everything](#running-everything)
- [How the System Works End-to-End](#how-the-system-works-end-to-end)
- [RAIS Protocol v1](#rais-protocol-v1)
- [Stripe Payments](#stripe-payments)
- [API Keys](#api-keys)
- [Emails (Resend)](#emails-resend)
- [Gateway Fallback Chain](#gateway-fallback-chain)
- [Deployment](#deployment)
- [Testing](#testing)
- [Commit Workflow](#commit-workflow)
- [Publishing Packages](#publishing-packages)
- [Troubleshooting](#troubleshooting)

---

## What Is This?

A **pnpm + Turborepo monorepo** with two distinct products:

1. **Open-source SDK** — the RAIS Protocol + client/server packages published to npm
2. **RAIS Cloud** — the hosted SaaS layer: a signup playground, a live AI gateway, and an email-based API key delivery system

```
Open Protocol (free, MIT)
  └─ packages/core, react, ui, vue, express, rais-compliance, …

RAIS Cloud (hosted, paid tiers)
  ├─ apps/playground  — landing page, waitlist, admin, Stripe billing
  └─ apps/gateway     — live API traffic, rate limiting, provider routing
```

Infrastructure: **Upstash Redis** (shared between playground + gateway), **Resend** (email), **Stripe** (payments), **Vercel** (deployment).

---

## Quick Setup

```bash
# Prerequisites: Node 20+, pnpm 9+
npm i -g pnpm

git clone https://github.com/trimooo/react-ai-stream.git
cd react-ai-stream

pnpm install          # installs all workspaces

# Copy env files (fill in real values — see Environment Variables section)
cp apps/playground/.env.local.example apps/playground/.env.local   # if exists
cp apps/gateway/.env.local.example    apps/gateway/.env.local      # if exists

# Start everything
pnpm dev              # runs all apps in parallel via Turborepo
```

Individual apps:
```bash
pnpm --filter playground dev    # port 3002
pnpm --filter gateway dev       # port 3003
pnpm --filter docs dev          # port 3004
pnpm --filter example dev       # port 3000
```

Build everything:
```bash
pnpm build            # builds all packages and apps via Turborepo
pnpm typecheck        # tsc --noEmit across every package
pnpm test             # vitest across every package with tests
pnpm lint             # eslint across everything
```

---

## Port Map

| Port | App | Command |
|------|-----|---------|
| 3000 | `apps/example` | `pnpm --filter example dev` |
| 3001 | `apps/nextjs-basic` | `pnpm --filter nextjs-basic dev` |
| 3002 | `apps/playground` | `pnpm --filter playground dev` |
| 3003 | `apps/gateway` | `pnpm --filter gateway dev` |
| 3004 | `apps/docs` | `pnpm --filter docs dev` |
| 5173 | `apps/vue-example` | `pnpm --filter vue-example dev` |
| 5174 | `apps/custom-ui` | `pnpm --filter custom-ui dev` |

---

## Monorepo Structure — Every File

```
react-ai-stream/
├── package.json                   ← root workspace: scripts (dev/build/test/lint)
├── pnpm-workspace.yaml            ← declares packages/* and apps/* as workspaces
├── turbo.json                     ← Turborepo pipeline: build → typecheck → lint → test
├── .prettierrc                    ← formatting: 100-char width, single quotes, trailing commas
├── .gitignore
├── CHANGELOG.md                   ← semver changelog for published packages
├── CONTRIBUTING.md                ← how to submit adapters, run tests, open RFCs
├── LICENSE                        ← MIT
├── TESTING.md                     ← integration test guide for the compliance suite
├── SECURITY.md                    ← vulnerability reporting + key rotation procedures
├── assets/logo.svg                ← project logo (used in README + playground)
│
├── rais-spec/                     ← formal protocol specification
│   ├── SPEC.md                    ← normative RAIS v1 wire format spec
│   ├── COMPLIANCE.md              ← compliance checklist (what a server must implement)
│   └── COMPATIBILITY.md           ← language implementation status matrix
│
├── rfcs/                          ← protocol extension proposals (RFC process)
│   └── README.md                  ← RFC submission guide
│
├── .github/
│   ├── workflows/ci.yml           ← CI: install → build → typecheck → test → lint
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       ├── feature_request.md
│       ├── community-implementation.md  ← for third-party adapter submissions
│       └── rfc-proposal.md
│
├── packages/
│   ├── core/                      ← @react-ai-stream/core (published)
│   │   ├── src/
│   │   │   ├── index.ts           ← public API: SSE parser, normalizer, Zustand store, abort utils
│   │   │   └── types.ts           ← StreamChunk, Message, AIClient types
│   │   ├── tests/
│   │   │   ├── sse-parser.test.ts
│   │   │   ├── chunk-normalizer.test.ts
│   │   │   ├── openai-provider.test.ts
│   │   │   └── anthropic-provider.test.ts
│   │   ├── tsup.config.ts         ← bundles to dist/index.{js,mjs,d.ts}
│   │   └── package.json           ← peerDep: zustand
│   │
│   ├── react/                     ← @react-ai-stream/react (published)
│   │   └── src/
│   │       ├── index.ts           ← exports useAIChat, AIChatProvider
│   │       └── useAIChat.ts       ← core hook: messages, sendMessage, loading, stop, error
│   │
│   ├── ui/                        ← @react-ai-stream/ui (published)
│   │   └── src/
│   │       ├── index.ts           ← exports Chat, MessageList, ChatInput, MarkdownRenderer
│   │       ├── Chat.tsx           ← full chat panel (wraps MessageList + ChatInput)
│   │       ├── MessageList.tsx    ← scrollable message history
│   │       ├── ChatInput.tsx      ← textarea with send/stop button
│   │       └── MarkdownRenderer.tsx ← syntax-highlighted code blocks + copy button
│   │
│   ├── vue/                       ← @react-ai-stream/vue (published)
│   │   └── src/
│   │       └── useAIChat.ts       ← Vue 3 composable, ShallowRef values, auto-abort on unmount
│   │
│   ├── express/                   ← @react-ai-stream/express (published)
│   │   └── src/
│   │       ├── index.ts           ← exports raisMiddleware()
│   │       ├── middleware.ts      ← Express request handler: calls provider, writes SSE
│   │       └── sse-writer.ts      ← writeChunk(res, chunk) — the SSE frame writer
│   │
│   ├── rais-compliance/           ← rais-compliance (published, CLI)
│   │   └── src/
│   │       ├── index.ts           ← CLI entry: npx rais-compliance <url>
│   │       ├── runner.ts          ← runs all test cases, prints pass/fail
│   │       └── mock-server.ts     ← in-process mock RAIS server for testing
│   │
│   ├── rais-server/               ← rais-server (published, CLI)
│   │   └── src/
│   │       └── index.ts           ← npx rais-server — instant RAIS endpoint from any API key
│   │
│   ├── create-ai-stream-app/      ← create-ai-stream-app (published, CLI)
│   │   └── src/
│   │       ├── index.ts           ← CLI entry: npx create-ai-stream-app
│   │       ├── prompts.ts         ← interactive questions: provider, UI style, TypeScript
│   │       └── scaffold.ts        ← generates project files from templates
│   │
│   └── python/                    ← rais (PyPI, pip install rais)
│       └── rais/
│           ├── __init__.py        ← exports stream_response() async generator
│           └── providers.py       ← OpenAI + Anthropic async generators
│
└── apps/
    │
    ├── playground/                ← AI Stream Studio + RAIS Cloud signup (port 3002)
    │   ├── app/
    │   │   ├── layout.tsx         ← root layout: fonts, metadata, nav
    │   │   ├── page.tsx           ← landing page: hero, feature grid, waitlist section
    │   │   ├── cloud/page.tsx     ← RAIS Cloud: pricing plans, waitlist form
    │   │   ├── inspect/page.tsx   ← SSE inspector: paste any endpoint, see raw events
    │   │   ├── benchmark/
    │   │   │   ├── page.tsx       ← benchmark landing
    │   │   │   └── BenchmarkClient.tsx ← client: fires parallel streams, measures latency
    │   │   ├── compare/page.tsx   ← side-by-side provider comparison
    │   │   ├── chat/page.tsx      ← full chat UI demo
    │   │   ├── gallery/page.tsx   ← UI component gallery
    │   │   ├── templates/page.tsx ← code templates for common patterns
    │   │   ├── ecosystem/page.tsx ← community adapters directory
    │   │   ├── admin/page.tsx     ← admin: waitlist management, key granting (secret-protected)
    │   │   └── api/
    │   │       ├── waitlist/route.ts       ← POST: save email to Redis, return position
    │   │       ├── admin/
    │   │       │   ├── waitlist/route.ts   ← GET: list all waitlist emails (admin only)
    │   │       │   └── grant/route.ts      ← POST: generate key, store in Redis, send email
    │   │       ├── stripe/
    │   │       │   ├── checkout/route.ts   ← POST: create Stripe Checkout Session
    │   │       │   └── webhook/route.ts    ← POST: Stripe webhook → generate key → send email
    │   │       ├── proxy/route.ts          ← POST: streaming proxy to any RAIS endpoint
    │   │       ├── rais-demo/route.ts      ← POST: demo RAIS stream (no key required)
    │   │       └── og/route.tsx            ← GET: OpenGraph image generation
    │   ├── components/
    │   │   ├── WaitlistForm.tsx    ← email input, optimistic position display
    │   │   ├── CloudContent.tsx    ← pricing cards, plan comparison
    │   │   ├── EndpointForm.tsx    ← SSE inspector URL + auth input
    │   │   ├── RawEventLog.tsx     ← live SSE event display
    │   │   ├── StreamTimeline.tsx  ← visual token timeline
    │   │   ├── CadenceChart.tsx    ← tokens/second chart
    │   │   ├── ComplianceReport.tsx ← RAIS protocol compliance checker
    │   │   ├── CodeGenPanel.tsx    ← generates client code for any endpoint
    │   │   ├── StreamReplay.tsx    ← replay saved SSE sessions
    │   │   └── NavLinks.tsx        ← top navigation links
    │   ├── hooks/
    │   │   ├── useStreamInspect.ts ← connects to SSE endpoint, parses RAIS events
    │   │   ├── useSessionHistory.ts ← saves/loads sessions from localStorage
    │   │   └── useShareSession.ts  ← generates shareable session URL
    │   ├── lib/
    │   │   ├── redis.ts            ← Upstash Redis client (uses KV_REST_API_URL/TOKEN)
    │   │   ├── email.ts            ← buildApiKey(), storeApiKey(), sendWelcomeEmail() via Resend
    │   │   ├── admin-auth.ts       ← timing-safe ADMIN_SECRET validation
    │   │   └── admin-rate-limit.ts ← Redis-backed brute-force: 10 failures → 15-min lockout
    │   ├── next.config.ts
    │   ├── package.json            ← Next.js 15, no extra AI packages (Stripe via fetch)
    │   └── .env.local              ← see Environment Variables section
    │
    ├── gateway/                    ← RAIS Cloud hosted API gateway (port 3003)
    │   ├── app/
    │   │   ├── layout.tsx          ← minimal layout
    │   │   ├── page.tsx            ← gateway landing: links to dashboard + docs
    │   │   ├── admin/page.tsx      ← admin: key management UI (ADMIN_SECRET protected)
    │   │   ├── dashboard/page.tsx  ← usage dashboard: token chart, key stats, live test
    │   │   └── api/
    │   │       ├── v1/
    │   │       │   ├── chat/route.ts    ← POST: main streaming endpoint (auth + rate-limit + fallback)
    │   │       │   ├── usage/route.ts   ← GET: per-key token usage stats
    │   │       │   ├── health/route.ts  ← GET: provider liveness check
    │   │       │   └── keys/route.ts    ← POST: create key, DELETE: revoke key
    │   │       └── admin/
    │   │           └── keys/route.ts   ← GET: list all keys (ADMIN_SECRET protected)
    │   ├── lib/
    │   │   ├── redis.ts            ← Upstash Redis client (uses UPSTASH_REDIS_REST_URL/TOKEN)
    │   │   ├── auth.ts             ← validateKey(): checks Redis for ras_live_/ras_test_ key
    │   │   ├── providers.ts        ← PROVIDERS map + streamWithFallback() generator
    │   │   ├── rate-limit.ts       ← sliding-window rate limit via Redis
    │   │   ├── usage.ts            ← incrementUsage(), getUsage() — token counters in Redis
    │   │   ├── guard.ts            ← per-plan body/message/char/token limits
    │   │   ├── rais-writer.ts      ← Web Streams SSE writer: writeText(), writeDone(), writeError()
    │   │   ├── logger.ts           ← structured request logging
    │   │   └── admin-auth.ts       ← timing-safe ADMIN_SECRET check
    │   ├── next.config.ts
    │   ├── package.json
    │   └── .env.local              ← see Environment Variables section
    │
    ├── docs/                       ← Nextra documentation site (port 3004)
    │   ├── pages/
    │   │   ├── _meta.json          ← Nextra nav order and labels
    │   │   ├── _app.tsx            ← custom App: injects fonts
    │   │   ├── index.mdx           ← docs home: hero, quick links, CTA
    │   │   ├── quickstart.mdx      ← Path A (RAIS Cloud) and Path B (self-hosted)
    │   │   ├── cloud.mdx           ← RAIS API key guide: how to get and use your key
    │   │   ├── architecture.mdx    ← system architecture diagram
    │   │   ├── spec.mdx            ← RAIS wire format reference
    │   │   ├── compliance.mdx      ← compliance test runner guide
    │   │   ├── packages.mdx        ← all published packages with API reference
    │   │   ├── ui.mdx              ← @react-ai-stream/ui component docs
    │   │   ├── devtools.mdx        ← DevTools panel guide
    │   │   ├── deploy.mdx          ← deployment guide (Vercel, Railway, Fly)
    │   │   ├── ecosystem.mdx       ← community adapters directory
    │   │   ├── playground.mdx      ← AI Stream Studio guide
    │   │   ├── rais-server.mdx     ← rais-server CLI guide
    │   │   ├── why-rais.mdx        ← comparison with Vercel AI SDK
    │   │   ├── faq.mdx             ← common questions
    │   │   ├── roadmap.mdx         ← what's next
    │   │   └── stats.mdx           ← usage stats (static)
    │   ├── components/
    │   │   ├── LiveDemo.tsx        ← embedded live chat demo
    │   │   ├── LiveDemoReal.tsx    ← live demo connected to real gateway
    │   │   ├── ArchDiagram.tsx     ← interactive architecture diagram
    │   │   ├── PackageGrid.tsx     ← package cards with install commands
    │   │   └── StatsPage.tsx       ← stats display component
    │   ├── theme.config.tsx        ← Nextra theme: logo, nav, footer, repo link
    │   └── package.json            ← nextra + nextra-theme-docs
    │
    ├── example/                    ← Live demo app — 3-model parallel streaming (port 3000)
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   └── page.tsx            ← hero + 3 DemoChat instances side by side
    │   ├── components/
    │   │   ├── DemoChat.tsx        ← one chat panel: useAIChat + @react-ai-stream/ui
    │   │   └── CopyCommand.tsx     ← animated copy-to-clipboard for npm install commands
    │   └── .env.local              ← GROQ_API_KEY (free key from console.groq.com)
    │
    ├── nextjs-basic/               ← Minimal Next.js starter (port 3001)
    │   └── app/
    │       └── page.tsx            ← single-file chat with useAIChat, no UI package
    │
    ├── custom-ui/                  ← Custom UI example (port 5174, Vite)
    │   ├── app/page.tsx            ← custom chat with Tailwind + raw @react-ai-stream/react
    │   └── components/
    │       ├── ChatPanel.tsx       ← full chat panel layout
    │       ├── MessageBubble.tsx   ← individual message bubble
    │       ├── ChatInput.tsx       ← input row
    │       └── Sidebar.tsx         ← conversation list sidebar
    │
    └── vue-example/                ← Vue 3 example (port 5173, Vite)
        └── src/
            └── App.vue             ← useAIChat Vue composable demo
```

---

## Environment Variables — Complete Reference

### `apps/playground/.env.local`

This app is the signup portal + admin panel. It needs Redis (for waitlist + API keys), Resend (email delivery), and Stripe (payments).

```env
# ── Upstash Redis (shared with gateway — same instance, different var names) ──
KV_REST_API_URL="https://your-instance.upstash.io"
KV_REST_API_TOKEN="your-token"

# ── Admin panel access ─────────────────────────────────────────────────────────
# Min 32 chars. Same value as gateway's ADMIN_SECRET. Never commit.
ADMIN_SECRET=rais_admin_sk_...

# ── Resend (email delivery) ───────────────────────────────────────────────────
# Get key at resend.com/api-keys (free tier: 3k emails/month)
RESEND_API_KEY="re_..."

# From address — must be a verified domain in your Resend account.
# Until rais.cloud is verified at resend.com/domains, use the shared Resend domain:
EMAIL_FROM="RAIS Cloud <onboarding@resend.dev>"

# DEV ONLY — Resend test mode only allows sending to your Resend account email.
# Set this to your Resend account email to redirect ALL outgoing email in dev.
# Leave blank (or remove) in production once rais.cloud domain is verified.
RESEND_TEST_TO="your-resend-account@email.com"

# ── Stripe (payments) ─────────────────────────────────────────────────────────
# Get key from stripe.com/dashboard → Developers → API Keys
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for test mode

# Webhook signing secret — Dashboard → Webhooks → your endpoint → Signing secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs for each plan — Dashboard → Products → copy Price ID (price_xxx)
STRIPE_PRICE_PRO=price_...             # €10/month
STRIPE_PRICE_TEAM=price_...            # €49/month

# Full URL of this app — used in Stripe checkout success/cancel redirect URLs
# Dev: http://localhost:3002  |  Prod: https://react-ai-stream-playground.vercel.app
NEXT_PUBLIC_BASE_URL=http://localhost:3002
```

### `apps/gateway/.env.local`

This app is the live API gateway. It needs Redis (to validate API keys + track usage) and at least one provider key to actually serve AI requests.

```env
# ── Upstash Redis (same instance as playground, different var names) ──────────
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# ── Admin panel access ─────────────────────────────────────────────────────────
# Same secret as playground. Min 32 chars.
ADMIN_SECRET=rais_admin_sk_...

# ── Provider API keys ─────────────────────────────────────────────────────────
# REQUIRED: At least one must be set or EVERY /api/v1/chat request returns
# "All providers failed". The gateway auto-fallbacks to any configured provider.
#
# Groq (free, fastest):  console.groq.com/keys
# OpenAI:                platform.openai.com/api-keys
# Anthropic:             console.anthropic.com/settings/keys
# Gemini:                aistudio.google.com/app/apikey
GROQ_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

### `apps/example/.env.local`

```env
# One key is enough — example uses Groq because it's free and instant
GROQ_API_KEY=gsk_...
```

### Redis key schema

Both playground and gateway share the same Upstash Redis instance. Here are the keys stored:

| Redis key | Type | Written by | Read by | Contents |
|-----------|------|-----------|---------|----------|
| `waitlist:emails` | Set | `playground/api/waitlist` | `playground/api/admin/waitlist` | Email addresses |
| `key:<id>` | Hash | `playground/api/admin/grant`, `playground/api/stripe/webhook` | `gateway/lib/auth.ts` | `id`, `owner_email`, `plan`, `key_string`, `monthly_limit`, `created_at` |
| `email_key:<email>` | String | same as above | admin routes | maps email → key id |
| `keys:all` | List | same as above | admin routes | all key ids in order |
| `usage:<id>:tokens` | String | `gateway/lib/usage.ts` | `gateway/api/v1/usage` | total tokens used |
| `usage:<id>:<YYYY-MM>` | String | `gateway/lib/usage.ts` | `gateway/api/v1/usage` | tokens used this month |
| `ratelimit:<id>:<window>` | String | `gateway/lib/rate-limit.ts` | same | request count in sliding window |
| `admin:fail:<ip>` | String | `playground/lib/admin-rate-limit.ts` | same | failed login attempts |

---

## Running Everything

### Development (all apps at once)

```bash
pnpm dev
# Turborepo starts all apps in parallel
# playground: http://localhost:3002
# gateway:    http://localhost:3003
# docs:       http://localhost:3004
# example:    http://localhost:3000
```

### Running one app

```bash
pnpm --filter playground dev
pnpm --filter gateway dev
pnpm --filter docs dev
pnpm --filter example dev
```

### Build

```bash
pnpm build                    # build everything
pnpm --filter playground build
pnpm --filter @react-ai-stream/core build
```

### Type check

```bash
pnpm typecheck                # runs tsc --noEmit in all packages
```

### Tests

```bash
pnpm test                     # vitest in all packages
pnpm --filter @react-ai-stream/core test
```

### Lint + Format

```bash
pnpm lint                     # eslint
pnpm format                   # prettier --write
```

---

## How the System Works End-to-End

### User signs up (free tier)

```
1. User visits /cloud on playground
2. Submits email via WaitlistForm
3. POST /api/waitlist → stores email in Redis (waitlist:emails set)
4. Admin visits /admin, enters ADMIN_SECRET
5. Admin clicks "Grant" next to an email
6. POST /api/admin/grant { email, plan } →
   a. Generates key: ras_test_<40hex> (free) or ras_live_<40hex> (paid)
   b. Stores key hash in Redis: key:<id> { owner_email, plan, monthly_limit, … }
   c. Stores email→id mapping: email_key:<email> = <id>
   d. Appends id to keys:all list
   e. Sends welcome email via Resend with the key embedded
```

### User pays (Pro/Team)

```
1. User clicks "Upgrade" on /cloud
2. POST /api/stripe/checkout { email, plan: 'pro' }
3. Server calls Stripe API → gets checkout session URL
4. Redirect user to Stripe-hosted payment page
5. User completes payment
6. Stripe POSTs to /api/stripe/webhook (checkout.session.completed)
7. Webhook verifies HMAC-SHA256 signature (from STRIPE_WEBHOOK_SECRET)
8. Webhook generates ras_live_<40hex> key, stores in Redis, sends welcome email
```

### User calls the gateway

```
1. User sends: POST /api/v1/chat
   Headers: Authorization: Bearer ras_live_<key>
   Body: { messages: [...], provider: 'groq', model: 'llama-3.3-70b-versatile' }

2. gateway/lib/auth.ts  → extracts id from key, looks up key:<id> in Redis
3. gateway/lib/rate-limit.ts → sliding window check (per-minute + per-month)
4. gateway/lib/guard.ts → enforces per-plan body size / message count / token limits
5. gateway/lib/providers.ts → streamWithFallback() picks primary provider + fallback chain
6. streamFromProvider() → calls provider API with gateway's server-side key
7. gateway/lib/rais-writer.ts → writes SSE frames (RAIS v1) to the response stream
8. gateway/lib/usage.ts → on completion, increments token counter in Redis
```

### User uses the key in their app

```ts
import { useAIChat } from '@react-ai-stream/react'

const { messages, sendMessage } = useAIChat({
  endpoint: 'https://react-ai-stream-gateway.vercel.app/api/v1/chat',
  extraHeaders: { Authorization: 'Bearer ras_live_YOUR_KEY' },
})
```

---

## RAIS Protocol v1

Three events. The entire protocol.

```
data: {"type":"text","text":"Hello"}\n\n    ← one per token
data: {"type":"done"}\n\n                   ← stream complete
data: {"type":"error","error":"..."}\n\n    ← unrecoverable failure
```

- Standard HTTP `text/event-stream` (SSE)
- Delivered over `POST` (not GET) — request body contains messages
- No authentication defined at protocol level — left to the implementation
- Protocol is frozen at v1. Backward compatibility is guaranteed.

Any server in any language that emits these three events is RAIS-compliant. Verify:

```bash
npx rais-compliance http://localhost:3003/api/v1/chat
```

---

## Stripe Payments

### How it's wired

| File | What it does |
|------|-------------|
| `apps/playground/app/api/stripe/checkout/route.ts` | Creates Stripe Checkout Session, returns `{ url }` |
| `apps/playground/app/api/stripe/webhook/route.ts` | Receives Stripe events, verifies HMAC-SHA256, generates key, sends email |
| `apps/playground/lib/email.ts` → `buildApiKey()` | Generates `ras_live_<40hex>` |
| `apps/playground/lib/email.ts` → `storeApiKey()` | Writes key to Redis |
| `apps/playground/lib/email.ts` → `sendWelcomeEmail()` | Sends welcome email via Resend |

No Stripe npm package — everything uses direct `fetch` to the Stripe REST API.

### Webhook signature verification

The webhook verifies Stripe's `Stripe-Signature` header using HMAC-SHA256 from scratch using Node.js `crypto` — no `stripe` npm package needed.

### Current live Stripe config

| Resource | Value |
|----------|-------|
| Pro price ID | `price_1TXqFhPAWZYsjgnllFRQoQrI` (€10/month) |
| Team price ID | `price_1TXqG8PAWZYsjgnl6NkAkroP` (€49/month) |
| Webhook endpoint | `https://react-ai-stream-playground.vercel.app/api/stripe/webhook` |
| Webhook events | `checkout.session.completed`, `customer.subscription.deleted` |

### Test with Stripe CLI

```bash
# Forward Stripe webhooks to local dev server
stripe listen --forward-to localhost:3002/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

### Plans

| Plan | Tokens/month | Req/min | Key format | Price |
|------|-------------|---------|------------|-------|
| Free | 5,000 | 10 | `ras_test_<hex>` | Free |
| Pro | 100,000 | 60 | `ras_live_<hex>` | €10/month |
| Team | 1,000,000 | 300 | `ras_live_<hex>` | €49/month |
| Enterprise | Unlimited | 1,000 | `ras_live_<hex>` | Contact us |

---

## API Keys

### Format

```
ras_test_<40-char hex>    ← free tier
ras_live_<40-char hex>    ← paid tiers (Pro, Team, Enterprise)
```

The prefix is 9 characters (`ras_live_` or `ras_test_`). The id stored in Redis is `keyString.slice(9)` — the 40-char hex part.

### Redis storage

```
key:<40-char-hex-id> → Hash {
  id:            <40-char hex>
  owner_email:   user@example.com
  plan:          free | pro | team | enterprise
  key_string:    ras_test_<id> or ras_live_<id>
  monthly_limit: 5000 | 100000 | 1000000 | -1
  created_at:    ISO timestamp
}
```

### Validation

`gateway/lib/auth.ts` → `validateKey(raw)`:
1. Extract id: `raw.slice(9)` (strips `ras_live_` or `ras_test_`)
2. `redis.hgetall("key:<id>")` — returns null if key doesn't exist or was revoked
3. Returns the full key record for downstream rate-limit and plan checks

### Revoking a key

```bash
# Via gateway API (requires the key itself):
curl -X DELETE https://react-ai-stream-gateway.vercel.app/api/v1/keys \
  -H "Authorization: Bearer ras_live_<key>"

# Directly in Redis:
redis-cli DEL key:<id>
redis-cli DEL email_key:<email>
redis-cli LREM keys:all 0 <id>
```

---

## Emails (Resend)

### How it works

`apps/playground/lib/email.ts` sends all emails via direct `fetch` to `https://api.resend.com/emails` — no Resend npm package.

### Dev limitation

Resend's free tier only allows sending to your verified account email in test mode. Set `RESEND_TEST_TO` to your Resend account email and all outgoing emails redirect there.

### Production setup

1. Verify `rais.cloud` at [resend.com/domains](https://resend.com/domains)
2. Change `EMAIL_FROM` to `RAIS Cloud <support@rais.cloud>`
3. Remove `RESEND_TEST_TO` from `.env.local`

---

## Gateway Fallback Chain

`apps/gateway/lib/providers.ts` → `streamWithFallback()`:

```
Request body: { provider: 'groq', fallback: ['openai'], messages: [...] }

Chain built as:
  ['groq', 'openai', ...auto-configured-providers-except-groq-and-openai]

For each provider in chain:
  1. Try streaming from that provider
  2. If error chunk received → break inner loop, try next
  3. If exception → try next
  4. If stream completes without error → return (done)

If all providers fail:
  yield { type: 'error', error: 'All providers failed or none are configured' }
```

Provider endpoints:

| Provider | Endpoint | Protocol |
|----------|----------|----------|
| Groq | `https://api.groq.com/openai/v1/chat/completions` | OpenAI-compat SSE |
| OpenAI | `https://api.openai.com/v1/chat/completions` | OpenAI SSE |
| Anthropic | `https://api.anthropic.com/v1/messages` | Anthropic SSE |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | OpenAI-compat SSE |

---

## Deployment

### playground → Vercel

```bash
cd apps/playground
vercel --prod

# Required env vars in Vercel dashboard:
# KV_REST_API_URL, KV_REST_API_TOKEN
# ADMIN_SECRET
# RESEND_API_KEY, EMAIL_FROM
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_TEAM
# NEXT_PUBLIC_BASE_URL=https://react-ai-stream-playground.vercel.app
```

Live URL: `https://react-ai-stream-playground.vercel.app`

### gateway → Vercel

```bash
cd apps/gateway
vercel --prod

# Required env vars:
# UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
# ADMIN_SECRET
# GROQ_API_KEY (+ any others you want in the fallback chain)
```

Live URL: `https://react-ai-stream-gateway.vercel.app`

### docs → Vercel

```bash
cd apps/docs
vercel --prod
```

Live URL: `https://react-ai-stream-docs.vercel.app`

### From root (Turborepo + Vercel)

The `vercel.json` / Turborepo config handles building only the changed apps on each push. CI runs on every push via `.github/workflows/ci.yml`.

---

## Testing

### Unit tests (packages)

```bash
pnpm test                          # all packages
pnpm --filter @react-ai-stream/core test
```

### Compliance tests (gateway)

```bash
# Start gateway locally first
pnpm --filter gateway dev

# Run RAIS compliance suite against it
npx rais-compliance http://localhost:3003/api/v1/chat
```

### Stripe webhook (local)

```bash
# Terminal 1: run playground
pnpm --filter playground dev

# Terminal 2: forward Stripe events
stripe listen --forward-to localhost:3002/api/stripe/webhook

# Terminal 3: trigger test events
stripe trigger checkout.session.completed
```

### Manual smoke tests

```bash
# Generate a free API key
curl -s -X POST http://localhost:3003/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","plan":"free"}' | jq

# Stream chat (replace key with generated one)
curl -s -X POST http://localhost:3003/api/v1/chat \
  -H "Authorization: Bearer ras_test_<key>" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hi"}],"provider":"groq"}' \
  --no-buffer

# Check usage
curl -s http://localhost:3003/api/v1/usage \
  -H "Authorization: Bearer ras_test_<key>"

# Health check
curl -s http://localhost:3003/api/v1/health
```

---

## Commit Workflow

```bash
# 1. Make your changes
# 2. Type check
pnpm typecheck

# 3. Test
pnpm test

# 4. Lint
pnpm lint

# 5. Commit (Conventional Commits style)
git add <specific files>
git commit -m "feat(gateway): add per-plan body size guard"
git commit -m "fix(playground): trim STRIPE_PRICE_TEAM env var"
git commit -m "chore: update lockfile"
git commit -m "docs: rewrite cloud.mdx to lead with API key requirement"
```

Commit prefixes: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

### Changeset (for package releases)

```bash
pnpm changeset             # describe what changed and bump type (patch/minor/major)
pnpm changeset version     # applies version bumps + updates CHANGELOG.md
pnpm changeset publish     # publishes all bumped packages to npm
```

---

## Publishing Packages

```bash
# Build all packages
pnpm build

# Check what would be published
pnpm --filter @react-ai-stream/core pack --dry-run

# Publish (requires npm auth)
npm login
pnpm changeset publish
```

Packages published to npm:
- `@react-ai-stream/core`
- `@react-ai-stream/react`
- `@react-ai-stream/ui`
- `@react-ai-stream/vue`
- `@react-ai-stream/express`
- `@react-ai-stream/devtools`
- `rais-compliance`
- `rais-server`
- `create-ai-stream-app`

---

## Troubleshooting

### "All providers failed or none are configured"

The gateway has no provider API keys set. Add at least one to `apps/gateway/.env.local`:
```env
GROQ_API_KEY=gsk_...   # free at console.groq.com/keys
```

### "Access to fetch blocked by CORS"

You're calling the gateway from a browser on a different origin. Options:
1. Use a server-side proxy (recommended — keeps your RAIS key secret)
2. The gateway already has `Access-Control-Allow-Origin: *` on all `/api/v1/*` routes — if you're still getting CORS errors, check that the OPTIONS preflight handler is present in the route

### Stripe webhook not firing

Check that:
1. Webhook URL is correct: `https://react-ai-stream-playground.vercel.app/api/stripe/webhook`
2. `STRIPE_WEBHOOK_SECRET` matches the signing secret in your Stripe dashboard
3. Webhook is listening for `checkout.session.completed` (and `customer.subscription.deleted`)

### Email not sending in dev

`RESEND_TEST_TO` must be set to your Resend account email. Resend's free tier only delivers to verified emails in test mode.

### Admin panel locked out (brute-force)

The admin rate limiter blocks the IP for 15 minutes after 10 failed attempts. To reset:
```bash
# In Upstash Redis console or CLI:
DEL admin:fail:<your-ip>
```

### TypeScript errors after editing

```bash
pnpm typecheck        # shows all errors across workspaces
```

### Port conflict

Check which process is on the conflicting port:
```bash
# Windows:
netstat -ano | findstr :3003

# macOS/Linux:
lsof -i :3003
```

---

## Contributing

- **Community adapters** (Svelte, Solid, Hono, Fastify, Go, Rails) — see [CONTRIBUTING.md](CONTRIBUTING.md)
- **Protocol proposals** — open an RFC in [`rfcs/`](rfcs/)
- **Bug reports** — [open an issue](https://github.com/trimooo/react-ai-stream/issues)
- **Show and tell** — [GitHub Discussions](https://github.com/trimooo/react-ai-stream/discussions)

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability reporting policy and API key rotation procedures.

## License

MIT
