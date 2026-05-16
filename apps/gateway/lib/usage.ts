import { getRedis } from './redis'
import type { Plan, KeyType } from './auth'

const DAY_BUCKET = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD
const MONTH_BUCKET = () => new Date().toISOString().slice(0, 7) // YYYY-MM

// Daily token caps by effective plan
const DAILY_TOKEN_CAP: Record<string, number> = {
  test: 1_000,
  free: 1_000,
  pro: -1,        // no daily cap, monthly enforced
  team: -1,
  enterprise: -1,
}

// Monthly token caps
const MONTHLY_TOKEN_CAP: Record<string, number> = {
  test: 5_000,
  free: 5_000,
  pro: 100_000,
  team: 1_000_000,
  enterprise: -1,
}

export interface UsageStats {
  requests_total: number
  tokens_total: number
  providers: Record<string, number>
  by_day: Record<string, number>
}

export interface CapResult {
  allowed: boolean
  reason?: string
}

export async function checkCaps(keyId: string, plan: Plan, key_type: KeyType): Promise<CapResult> {
  const effectivePlan = key_type === 'test' ? 'test' : plan
  const dailyCap = DAILY_TOKEN_CAP[effectivePlan] ?? -1
  const monthlyCap = MONTHLY_TOKEN_CAP[effectivePlan] ?? -1

  if (dailyCap === -1 && monthlyCap === -1) return { allowed: true }

  try {
    const redis = getRedis()
    const day = DAY_BUCKET()
    const month = MONTH_BUCKET()

    const [dailyTokens, monthlyTokens] = await Promise.all([
      dailyCap !== -1 ? redis.hget<string>(`usage:${keyId}:days`, day) : Promise.resolve(null),
      monthlyCap !== -1 ? redis.hget<string>(`usage:${keyId}:months`, month) : Promise.resolve(null),
    ])

    if (dailyCap !== -1 && Number(dailyTokens ?? 0) >= dailyCap) {
      return { allowed: false, reason: `Daily token cap reached (${dailyCap.toLocaleString()})` }
    }
    if (monthlyCap !== -1 && Number(monthlyTokens ?? 0) >= monthlyCap) {
      return { allowed: false, reason: `Monthly token cap reached (${monthlyCap.toLocaleString()})` }
    }
    return { allowed: true }
  } catch {
    return { allowed: true } // never block on Redis failure
  }
}

export async function incrementUsage(keyId: string, provider: string, tokens: number): Promise<void> {
  try {
    const redis = getRedis()
    const day = DAY_BUCKET()
    const month = MONTH_BUCKET()
    const pipe = redis.pipeline()
    pipe.hincrby(`usage:${keyId}`, 'requests', 1)
    pipe.hincrby(`usage:${keyId}`, 'tokens', tokens)
    pipe.hincrby(`usage:${keyId}:providers`, provider, 1)
    pipe.hincrby(`usage:${keyId}:days`, day, tokens)
    pipe.hincrby(`usage:${keyId}:months`, month, tokens)
    await pipe.exec()
  } catch {
    // best-effort — never block the stream
  }
}

export async function getUsage(keyId: string): Promise<UsageStats> {
  const redis = getRedis()
  const [base, providers, days] = await Promise.all([
    redis.hgetall<Record<string, string>>(`usage:${keyId}`),
    redis.hgetall<Record<string, string>>(`usage:${keyId}:providers`),
    redis.hgetall<Record<string, string>>(`usage:${keyId}:days`),
  ])

  const toNum = (r: Record<string, string> | null) =>
    Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, Number(v)]))

  return {
    requests_total: Number(base?.requests ?? 0),
    tokens_total: Number(base?.tokens ?? 0),
    providers: toNum(providers),
    by_day: toNum(days),
  }
}
