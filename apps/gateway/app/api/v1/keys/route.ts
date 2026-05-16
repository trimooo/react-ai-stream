export const runtime = 'nodejs'

import { getRedis } from '@/lib/redis'
import { extractBearer, validateKey } from '@/lib/auth'
import { randomBytes } from 'crypto'

function generateId(): string {
  return randomBytes(20).toString('hex') // 40-char hex
}

function buildKey(plan: string): string {
  // Pro/Team/Enterprise get live keys. Free gets test keys.
  const type = plan === 'free' ? 'test' : 'live'
  return `ras_${type}_${generateId()}`
}

// POST /api/v1/keys — create a new API key
export async function POST(req: Request) {
  let email: string
  let plan: string
  try {
    const body = await req.json()
    email = (body.email ?? '').trim().toLowerCase()
    plan = body.plan ?? 'free'
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }

  const validPlans = ['free', 'pro', 'team', 'enterprise']
  if (!validPlans.includes(plan)) plan = 'free'

  const monthly_limits: Record<string, number> = {
    free:       5_000,
    pro:        100_000,
    team:       1_000_000,
    enterprise: -1,
  }

  const redis = getRedis()
  const keyString = buildKey(plan)
  // strip prefix to get the raw id stored in Redis
  const id = keyString.slice(9) // strip ras_live_ or ras_test_ (both 9 chars)
  const now = new Date().toISOString()

  await redis.hset(`key:${id}`, {
    id,
    owner_email: email,
    plan,
    key_string: keyString,
    monthly_limit: monthly_limits[plan] ?? 0,
    created_at: now,
  })
  await redis.set(`email_key:${email}`, id)
  await redis.rpush('keys:all', id)

  return Response.json(
    { key: keyString, plan, key_type: plan === 'free' ? 'test' : 'live', created_at: now },
    { status: 201 },
  )
}

// DELETE /api/v1/keys — revoke the authenticated key
export async function DELETE(req: Request) {
  const raw = extractBearer(req.headers.get('Authorization'))
  if (!raw) return Response.json({ error: 'Missing Authorization' }, { status: 401 })
  const record = await validateKey(raw)
  if (!record) return Response.json({ error: 'Invalid key' }, { status: 401 })

  const redis = getRedis()
  await Promise.all([
    redis.del(`key:${record.id}`),
    redis.del(`email_key:${record.owner_email}`),
    redis.lrem('keys:all', 0, record.id),
  ])
  return Response.json({ ok: true })
}
