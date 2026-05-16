export const runtime = 'nodejs'

import { getRedis } from '@/lib/redis'
import { buildApiKey, storeApiKey, sendWelcomeEmail } from '@/lib/email'

const PAID_PLANS = ['pro', 'team', 'enterprise']

export async function POST(req: Request) {
  let email: string
  let name: string
  let use_case: string
  let plan: string
  try {
    const body = await req.json()
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    name = typeof body.name === 'string' ? body.name.trim() : ''
    use_case = typeof body.use_case === 'string' ? body.use_case.trim() : ''
    plan = typeof body.plan === 'string' ? body.plan.trim() : 'free'
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }

  const validPlans = ['free', 'pro', 'team', 'enterprise']
  if (!validPlans.includes(plan)) plan = 'free'

  const redis = getRedis()

  // If already registered, return their existing key (free) or waitlist status (paid)
  const existingId = await redis.get<string>(`email_key:${email}`)
  if (existingId) {
    const record = await redis.hgetall(`key:${existingId}`) as Record<string, string> | null
    const position = await redis.scard('waitlist:emails')
    return Response.json({
      ok: true,
      position,
      plan: record?.['plan'] ?? 'free',
      key: plan === 'free' ? (record?.['key_string'] ?? null) : null,
      already_registered: true,
    })
  }

  const joined_at = new Date().toISOString()
  const entry = JSON.stringify({ email, name, use_case, plan, joined_at })
  await redis.sadd('waitlist:emails', email)
  await redis.rpush('waitlist:log', entry)
  await redis.hset(`waitlist:user:${email}`, { name, use_case, plan, joined_at })

  const position = await redis.scard('waitlist:emails')

  if (PAID_PLANS.includes(plan)) {
    // Paid plans: just store, no key generated — admin will grant manually
    sendWelcomeEmail({ email, name, apiKey: '', plan, use_case }).catch(err =>
      console.error('[email] waitlist confirmation send failed:', err)
    )
    return Response.json({ ok: true, position, plan, key: null })
  }

  // Free plan: generate key immediately
  const { keyString, id } = buildApiKey('free')
  await storeApiKey({ id, keyString, email, plan: 'free' })

  sendWelcomeEmail({ email, name, apiKey: keyString, plan: 'free', use_case }).catch(err =>
    console.error('[email] welcome email send failed:', err)
  )

  return Response.json({ ok: true, position, plan: 'free', key: keyString })
}
