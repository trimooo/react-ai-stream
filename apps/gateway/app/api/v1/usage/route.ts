export const runtime = 'nodejs'

import { extractBearer, validateKey } from '@/lib/auth'
import { getUsage } from '@/lib/usage'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: Request) {
  const raw = extractBearer(req.headers.get('Authorization'))
  if (!raw) return Response.json({ error: 'Missing Authorization' }, { status: 401, headers: CORS })
  const record = await validateKey(raw)
  if (!record) return Response.json({ error: 'Invalid key' }, { status: 401, headers: CORS })

  const stats = await getUsage(record.id)
  return Response.json({
    key_id: record.id,
    plan: record.plan,
    monthly_limit: record.monthly_limit,
    ...stats,
  }, { headers: CORS })
}
