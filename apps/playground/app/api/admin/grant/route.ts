export const runtime = 'nodejs'

import { checkAdminAuth, adminForbidden } from '@/lib/admin-auth'
import { isAdminRateLimited, recordAdminFailure, clearAdminFailures, rateLimitedResponse } from '@/lib/admin-rate-limit'
import { getRedis } from '@/lib/redis'
import { buildApiKey, storeApiKey, sendWelcomeEmail } from '@/lib/email'

// POST /api/admin/grant — create/upgrade a key for a specific email and send the welcome email
export async function POST(req: Request) {
  if (await isAdminRateLimited(req)) return rateLimitedResponse()

  if (!checkAdminAuth(req)) {
    await recordAdminFailure(req)
    return adminForbidden()
  }

  await clearAdminFailures(req)

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

  // Look up waitlist user data for personalized email
  const userData = await redis.hgetall(`waitlist:user:${email}`) as Record<string, string> | null
  const name = userData?.['name'] ?? email
  const use_case = userData?.['use_case'] ?? 'Other'

  // If they already have a key, revoke it first (upgrade path)
  const existingId = await redis.get<string>(`email_key:${email}`)
  if (existingId) {
    await Promise.all([
      redis.del(`key:${existingId}`),
      redis.lrem('keys:all', 0, existingId),
    ])
  }

  // Generate new key at the specified plan
  const { keyString, id } = buildApiKey(plan)
  await storeApiKey({ id, keyString, email, plan })

  // Send email and capture result so admin knows if delivery succeeded
  const emailResult = await sendWelcomeEmail({ email, name, apiKey: keyString, plan, use_case })

  return Response.json({
    ok: true,
    key: keyString,
    plan,
    email_sent: emailResult.sent,
    email_redirected_to: emailResult.redirected_to ?? null,
    email_error: emailResult.error ?? null,
  })
}
