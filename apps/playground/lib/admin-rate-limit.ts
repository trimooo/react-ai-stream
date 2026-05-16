import { getRedis } from './redis'

const MAX_FAILURES = 10
const WINDOW_SECS = 900 // 15 minutes

function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function isAdminRateLimited(req: Request): Promise<boolean> {
  try {
    const ip = getIp(req)
    const redis = getRedis()
    const count = await redis.get<number>(`admin:fail:${ip}`) ?? 0
    return count >= MAX_FAILURES
  } catch {
    return false // don't block if Redis is down
  }
}

export async function recordAdminFailure(req: Request): Promise<void> {
  try {
    const ip = getIp(req)
    const redis = getRedis()
    const key = `admin:fail:${ip}`
    await redis.incr(key)
    await redis.expire(key, WINDOW_SECS)
  } catch { /* non-fatal */ }
}

export async function clearAdminFailures(req: Request): Promise<void> {
  try {
    const ip = getIp(req)
    await getRedis().del(`admin:fail:${ip}`)
  } catch { /* non-fatal */ }
}

export function rateLimitedResponse(): Response {
  return Response.json(
    { error: 'Too many failed attempts. Try again in 15 minutes.' },
    { status: 429 },
  )
}
