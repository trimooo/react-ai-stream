# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| RAIS Protocol v1 (current) | Yes |
| Pre-release / main branch | Best effort |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email: **leo@devleo.de**

Include in your report:
- Description of the vulnerability
- Steps to reproduce (or a proof-of-concept)
- Which component is affected (SDK, gateway, playground, protocol)
- Impact assessment (what an attacker could do)

You will receive an acknowledgement within 48 hours. A fix timeline will be shared within 5 business days.

We follow responsible disclosure: please give us 90 days to fix before public disclosure.

---

## Scope

### In scope

- Authentication bypass in `apps/gateway/lib/auth.ts` (API key validation)
- Admin panel bypass in `apps/playground/lib/admin-auth.ts` or `apps/gateway/lib/admin-auth.ts`
- Rate limit bypass in `apps/gateway/lib/rate-limit.ts`
- Webhook signature bypass in `apps/playground/app/api/stripe/webhook/route.ts`
- API key generation weaknesses (e.g., insufficient entropy in `randomBytes`)
- Cross-tenant data access (one user reading another user's keys or usage)
- SSRF via the proxy endpoint (`apps/playground/app/api/proxy/route.ts`)
- Secrets leaking in API responses, logs, or error messages
- Dependency vulnerabilities with exploitable impact

### Out of scope

- Denial-of-service attacks (rate limits are a best-effort defense, not a security boundary)
- Issues requiring physical access to the server
- Social engineering
- Issues in third-party services (Upstash, Resend, Stripe, Vercel) — report those to the vendors
- Missing security headers without a demonstrated exploit path

---

## Security Architecture

### API key validation

Keys are validated in `apps/gateway/lib/auth.ts`. The key id is extracted from the bearer token and looked up in Upstash Redis (`key:<id>` hash). A missing or revoked key returns 401 immediately.

Key entropy: `randomBytes(20)` = 160 bits. Brute-forcing the key space is computationally infeasible.

### Admin authentication

Both playground and gateway use timing-safe comparison (`crypto.timingSafeEqual`) for `ADMIN_SECRET` in `lib/admin-auth.ts`. This prevents timing attacks on the secret.

The admin panel also has a brute-force lockout: 10 failed attempts from the same IP trigger a 15-minute block enforced in Redis (`admin:fail:<ip>` key with TTL).

### Stripe webhook verification

`apps/playground/app/api/stripe/webhook/route.ts` verifies Stripe's `Stripe-Signature` header using HMAC-SHA256 via Node.js `crypto.createHmac`. The raw request body is read before JSON parsing to ensure the signature covers the exact bytes Stripe signed. No Stripe npm package is used — the verification is implemented from scratch against the [Stripe documentation](https://stripe.com/docs/webhooks/signatures).

### Secrets in environment variables

No secrets are committed to the repository. Files that contain real secrets:
- `apps/playground/.env.local` — gitignored
- `apps/gateway/.env.local` — gitignored

The `.gitignore` at root covers `*.env.local` and `.env*` patterns.

### CORS

All public gateway routes (`/api/v1/*`) return `Access-Control-Allow-Origin: *`. This is intentional — the API is a public gateway and clients need to call it from any origin. API keys are the authentication boundary, not CORS.

The admin routes do not have CORS headers and must be called server-side.

---

## Credential Rotation

### Rotating the ADMIN_SECRET

1. Generate a new secret (min 32 chars):
   ```bash
   node -e "console.log('rais_admin_sk_' + require('crypto').randomBytes(16).toString('hex'))"
   ```
2. Update `ADMIN_SECRET` in both `apps/playground/.env.local` and `apps/gateway/.env.local`
3. Update the same variable in Vercel environment settings for both apps
4. Redeploy both apps

### Rotating Upstash Redis credentials

1. Create new token in Upstash dashboard → copy new URL + token
2. Update `KV_REST_API_URL` + `KV_REST_API_TOKEN` in playground
3. Update `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in gateway
4. Revoke the old token in Upstash dashboard
5. Redeploy both apps

### Rotating the Resend API key

1. Create new key at resend.com/api-keys
2. Update `RESEND_API_KEY` in playground `.env.local` and Vercel
3. Revoke the old key in Resend dashboard
4. Redeploy playground

### Rotating Stripe keys

1. Dashboard → Developers → API Keys → Roll key
2. Update `STRIPE_SECRET_KEY` in playground `.env.local` and Vercel
3. Verify webhook: Dashboard → Webhooks → Reveal signing secret (new after roll)
4. Update `STRIPE_WEBHOOK_SECRET` accordingly
5. Redeploy playground

### Revoking a user API key

If a RAIS API key (`ras_live_*` or `ras_test_*`) is compromised:

**Via API (requires the key itself):**
```bash
curl -X DELETE https://react-ai-stream-gateway.vercel.app/api/v1/keys \
  -H "Authorization: Bearer ras_live_COMPROMISED_KEY"
```

**Via Upstash Redis console (admin access):**
```
1. Find the key id: look up `email_key:<user-email>` → get id
2. DEL key:<id>
3. DEL email_key:<user-email>
4. LREM keys:all 0 <id>
```

After revocation, the next API call with that key returns 401 immediately (within milliseconds — no cache).

### Rotating provider API keys (Groq / OpenAI / Anthropic / Gemini)

Provider keys are only in `apps/gateway/.env.local` (and Vercel env vars for the gateway app). Users never see these keys — the gateway injects them server-side.

If a provider key is compromised:
1. Revoke it in the provider's dashboard
2. Generate a new key
3. Update `GROQ_API_KEY` / `OPENAI_API_KEY` / etc. in Vercel env vars for the gateway
4. Redeploy the gateway

---

## Known Limitations

- **Rate limiting is Redis-backed, not atomic** — under extreme burst traffic, a small number of over-limit requests may slip through before Redis updates. This is by design (availability over strict enforcement).
- **Gateway has no IP allowlist** — any client with a valid key can call from any IP. This is intentional for the public API.
- **Admin panel has no 2FA** — the `ADMIN_SECRET` is a single static secret. Rotate it if you suspect it's been observed.

---

## Acknowledgements

We thank everyone who reports vulnerabilities responsibly. Significant reports will be credited in the changelog (with your permission).
