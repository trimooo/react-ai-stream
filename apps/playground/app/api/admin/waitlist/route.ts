export const runtime = 'nodejs'

import { checkAdminAuth, adminForbidden } from '@/lib/admin-auth'
import { isAdminRateLimited, recordAdminFailure, clearAdminFailures, rateLimitedResponse } from '@/lib/admin-rate-limit'
import { getRedis } from '@/lib/redis'

export async function GET(req: Request) {
  if (await isAdminRateLimited(req)) return rateLimitedResponse()

  if (!checkAdminAuth(req)) {
    await recordAdminFailure(req)
    return adminForbidden()
  }

  await clearAdminFailures(req)

  const redis = getRedis()
  const [rawEntries, total] = await Promise.all([
    redis.lrange('waitlist:log', 0, -1),
    redis.scard('waitlist:emails'),
  ])

  const entries = rawEntries.map(e => {
    try { return typeof e === 'string' ? JSON.parse(e) : e }
    catch { return { raw: e } }
  })

  return Response.json({ total, entries })
}
