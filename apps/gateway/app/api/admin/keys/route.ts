export const runtime = 'nodejs'

import { checkAdminAuth, adminForbidden } from '@/lib/admin-auth'
import { getRedis } from '@/lib/redis'
import { randomBytes } from 'crypto'

function generateId(): string {
  return randomBytes(20).toString('hex')
}

function buildKey(plan: string): string {
  const type = plan === 'free' ? 'test' : 'live'
  return `ras_${type}_${generateId()}`
}

const MONTHLY_LIMITS: Record<string, number> = {
  free:       5_000,
  pro:        100_000,
  team:       1_000_000,
  enterprise: -1,
}

// GET /api/admin/keys — list all keys
export async function GET(req: Request) {
  if (!checkAdminAuth(req)) return adminForbidden()

  const redis = getRedis()
  const ids = await redis.lrange('keys:all', 0, -1)

  if (ids.length === 0) return Response.json({ keys: [] })

  const records = await Promise.all(
    ids.map(id => redis.hgetall(`key:${id}`) as Promise<Record<string, string> | null>)
  )

  const keys = records
    .map((r, i) => r ? { ...r, id: ids[i] } : null)
    .filter(Boolean)

  return Response.json({ keys })
}

// POST /api/admin/keys — create a key of any plan
export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return adminForbidden()

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

  const redis = getRedis()
  const keyString = buildKey(plan)
  const id = keyString.slice(9) // strip ras_live_ or ras_test_
  const now = new Date().toISOString()

  await redis.hset(`key:${id}`, {
    id,
    owner_email: email,
    plan,
    key_string: keyString,
    monthly_limit: MONTHLY_LIMITS[plan] ?? 0,
    created_at: now,
    admin_created: 'true',
  })
  await redis.set(`email_key:${email}`, id)
  await redis.rpush('keys:all', id)

  return Response.json({ key: keyString, plan, created_at: now }, { status: 201 })
}

// DELETE /api/admin/keys?id=<id> — revoke any key by ID
export async function DELETE(req: Request) {
  if (!checkAdminAuth(req)) return adminForbidden()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id query param required' }, { status: 400 })

  const redis = getRedis()
  const record = await redis.hgetall(`key:${id}`) as Record<string, string> | null
  if (!record) return Response.json({ error: 'Key not found' }, { status: 404 })

  await Promise.all([
    redis.del(`key:${id}`),
    record.owner_email ? redis.del(`email_key:${record.owner_email}`) : Promise.resolve(),
    redis.lrem('keys:all', 0, id),
  ])

  return Response.json({ ok: true })
}
