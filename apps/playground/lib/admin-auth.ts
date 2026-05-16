import { timingSafeEqual } from 'crypto'

// Timing-safe admin secret verification.
// Set ADMIN_SECRET in .env.local — min 32 chars.
export function checkAdminAuth(req: Request): boolean {
  const secret = (process.env.ADMIN_SECRET ?? '').trim()
  if (secret.length < 20) return false

  const header = req.headers.get('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return false

  const provided = header.slice(7).trim()
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false

  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function adminForbidden() {
  // Generic response — never hint at what went wrong
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
