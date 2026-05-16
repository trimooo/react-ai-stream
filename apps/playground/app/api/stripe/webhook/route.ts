export const runtime = 'nodejs'

// ─── Stripe Webhook Handler ───────────────────────────────────────────────────
//
// This route receives events from Stripe after a successful payment.
// When `checkout.session.completed` fires, we:
//   1. Read the email + plan from the session metadata
//   2. Generate a live API key at the purchased plan
//   3. Send the welcome email with the key + use-case quickstart
//
// SETUP:
//   1. In the Stripe dashboard → Webhooks → Add endpoint:
//      URL: https://your-domain.vercel.app/api/stripe/webhook
//      Events: checkout.session.completed, customer.subscription.deleted
//   2. Copy the signing secret and set STRIPE_WEBHOOK_SECRET in .env.local
//
// IMPORTANT: Vercel requires `export const config = { api: { bodyParser: false } }` in
// Pages Router. In App Router (this file), Next.js does NOT auto-parse the body, which
// is exactly what Stripe needs for signature verification.

import { buildApiKey, storeApiKey, sendWelcomeEmail } from '@/lib/email'
import { getRedis } from '@/lib/redis'

async function stripeVerify(req: Request): Promise<Record<string, unknown> | null> {
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? '').trim()
  if (!webhookSecret) return null

  const sig = req.headers.get('stripe-signature') ?? ''
  const rawBody = await req.text()

  // Manual Stripe signature verification (avoids importing stripe npm package)
  // Stripe signs with: t=timestamp,v1=HMAC-SHA256(secret, timestamp.body)
  const pairs = sig.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=')
    if (k && v) acc[k] = v
    return acc
  }, {})

  const t = pairs['t']
  const v1 = pairs['v1']
  if (!t || !v1) return null

  const { createHmac } = await import('crypto')
  const expected = createHmac('sha256', webhookSecret)
    .update(`${t}.${rawBody}`)
    .digest('hex')

  if (expected !== v1) return null

  // Replay attack protection: reject events older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return null

  try {
    return JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const event = await stripeVerify(req)
  if (!event) {
    return Response.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  const type = event['type'] as string

  if (type === 'checkout.session.completed') {
    const session = event['data'] as Record<string, unknown>
    const obj = session['object'] as Record<string, unknown>
    const metadata = (obj['metadata'] ?? {}) as Record<string, string>
    const email = (metadata['email'] ?? '').trim().toLowerCase()
    const plan  = (metadata['plan']  ?? 'pro').trim()

    if (!email || !['pro', 'team', 'enterprise'].includes(plan)) {
      console.error('[stripe] webhook: missing or invalid metadata', metadata)
      return Response.json({ received: true })
    }

    // Revoke any existing key (upgrade path)
    const redis = getRedis()
    const existingId = await redis.get<string>(`email_key:${email}`)
    if (existingId) {
      await Promise.all([
        redis.del(`key:${existingId}`),
        redis.lrem('keys:all', 0, existingId),
      ])
    }

    // Grant a live key at the purchased plan
    const { keyString, id } = buildApiKey(plan)
    await storeApiKey({ id, keyString, email, plan })

    // Look up user data for personalised email
    const userData = await redis.hgetall(`waitlist:user:${email}`) as Record<string, string> | null
    const name     = userData?.['name']     ?? email
    const use_case = userData?.['use_case'] ?? 'SaaS product'

    sendWelcomeEmail({ email, name, apiKey: keyString, plan, use_case }).catch(err =>
      console.error('[stripe] welcome email failed:', err),
    )

    console.log(`[stripe] granted ${plan} key to ${email}`)
  }

  if (type === 'customer.subscription.deleted') {
    // Subscription cancelled — downgrade to free or revoke key
    // For now, just log. Implement downgrade logic here as needed.
    const session = event['data'] as Record<string, unknown>
    const obj = session['object'] as Record<string, unknown>
    console.log('[stripe] subscription cancelled:', (obj['id'] as string) ?? 'unknown')
  }

  return Response.json({ received: true })
}
