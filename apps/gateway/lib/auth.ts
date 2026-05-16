import { getRedis } from './redis'

export type Plan = 'free' | 'pro' | 'team' | 'enterprise'
export type KeyType = 'live' | 'test'

export interface ApiKeyRecord {
  id: string
  key_type: KeyType
  owner_email: string
  plan: Plan
  monthly_limit: number
  created_at: string
}

// Parse ras_live_<hex> or ras_test_<hex> into id + type
function parseKeyString(raw: string): { id: string; key_type: KeyType } | null {
  if (raw.startsWith('ras_live_')) return { id: raw.slice(9), key_type: 'live' }
  if (raw.startsWith('ras_test_')) return { id: raw.slice(9), key_type: 'test' }
  return null
}

export async function validateKey(raw: string): Promise<ApiKeyRecord | null> {
  const parsed = parseKeyString(raw)
  if (!parsed) return null
  const { id, key_type } = parsed
  try {
    const redis = getRedis()
    const record = await redis.hgetall(`key:${id}`) as Record<string, string> | null
    if (!record || !record['owner_email']) return null
    return {
      id,
      key_type,
      owner_email: record['owner_email'] ?? '',
      plan: (record['plan'] ?? 'free') as Plan,
      monthly_limit: Number(record['monthly_limit'] ?? 0),
      created_at: record['created_at'] ?? '',
    }
  } catch {
    return null
  }
}

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(ras_(?:live|test)_\S+)$/i)
  return match ? (match[1] ?? null) : null
}

export function keyIdFromRaw(raw: string): string {
  const parsed = parseKeyString(raw)
  return parsed?.id ?? raw
}
