export const runtime = 'nodejs'

// ─── Stripe Checkout Session ──────────────────────────────────────────────────
//
// SETUP:
//   1. Create a Stripe account at stripe.com
//   2. Add products in the Stripe dashboard (or use stripe fixtures):
//      - "RAIS Cloud Pro"  → price_xxx  (€10/mo recurring)
//      - "RAIS Cloud Team" → price_yyy  (€49/mo recurring)
//   3. Add to .env.local:
//      STRIPE_SECRET_KEY=sk_test_...
//      STRIPE_WEBHOOK_SECRET=whsec_...
//      NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
//   4. Install: pnpm add stripe --filter playground
//
// USAGE:
//   POST /api/stripe/checkout  { email: string, plan: 'pro' | 'team' }
//   → Returns { url: string }  (redirect the user to url)

const PRICE_IDS: Record<string, string> = {
  pro:  (process.env.STRIPE_PRICE_PRO  ?? '').trim(),
  team: (process.env.STRIPE_PRICE_TEAM ?? '').trim(),
}

export async function POST(req: Request) {
  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').trim()
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured on this server' }, { status: 503 })
  }

  let email: string
  let plan: string
  try {
    const body = await req.json()
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    plan  = typeof body.plan  === 'string' ? body.plan.trim()               : ''
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    return Response.json({ error: `Unknown plan: ${plan}. Valid: pro, team` }, { status: 400 })
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/$/, '')

  // Call Stripe API directly (no stripe npm package needed for this simple case)
  const params = new URLSearchParams({
    'mode':                         'subscription',
    'customer_email':               email,
    'line_items[0][price]':         priceId,
    'line_items[0][quantity]':      '1',
    'success_url':                  `${base}/cloud?checkout=success&plan=${plan}`,
    'cancel_url':                   `${base}/cloud?checkout=cancel`,
    'metadata[email]':              email,
    'metadata[plan]':               plan,
    'allow_promotion_codes':        'true',
    'billing_address_collection':   'auto',
  })

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[stripe] checkout session error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 502 })
  }

  const session = await res.json()
  return Response.json({ url: session.url })
}
