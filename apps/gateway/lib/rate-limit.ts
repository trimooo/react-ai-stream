import { getRedis } from './redis'
import type { Plan, KeyType } from './auth'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  reason?: 'per_minute' | 'per_day'
}

// Per-plan limits: [req/min, req/day]
const LIMITS: Record<Plan | 'test', [number, number]> = {
  test:       [10,   100],
  free:       [10,   100],
  pro:        [60,   5_000],
  team:       [300,  50_000],
  enterprise: [1000, -1],       // -1 = unlimited
}

const MINUTE_MS = 60_000
const DAY_MS = 86_400_000

export async function checkRateLimit(
  keyId: string,
  plan: Plan,
  key_type: KeyType,
): Promise<RateLimitResult> {
  const effectivePlan: Plan | 'test' = key_type === 'test' ? 'test' : plan
  const [minuteLimit, dayLimit] = LIMITS[effectivePlan]

  const redis = getRedis()
  const now = Date.now()
  const minuteStart = now - MINUTE_MS
  const dayStart = now - DAY_MS
  const member = `${now}-${Math.random()}`

  const pipe = redis.pipeline()

  // Per-minute window
  pipe.zremrangebyscore(`rl:min:${keyId}`, 0, minuteStart)
  pipe.zcard(`rl:min:${keyId}`)
  pipe.zadd(`rl:min:${keyId}`, { score: now, member: `m-${member}` })
  pipe.expire(`rl:min:${keyId}`, 120)

  // Per-day window
  pipe.zremrangebyscore(`rl:day:${keyId}`, 0, dayStart)
  pipe.zcard(`rl:day:${keyId}`)
  pipe.zadd(`rl:day:${keyId}`, { score: now, member: `d-${member}` })
  pipe.expire(`rl:day:${keyId}`, 172_800)

  const results = await pipe.exec()
  const minuteCount = (results[1] as number) ?? 0
  const dayCount = (results[5] as number) ?? 0

  if (minuteCount >= minuteLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.ceil((now + MINUTE_MS) / 1000),
      reason: 'per_minute',
    }
  }

  if (dayLimit !== -1 && dayCount >= dayLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.ceil((now + DAY_MS) / 1000),
      reason: 'per_day',
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, minuteLimit - minuteCount - 1),
    resetAt: Math.ceil((now + MINUTE_MS) / 1000),
  }
}
