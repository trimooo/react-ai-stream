import type { Plan, KeyType } from './auth'

export interface GuardConfig {
  max_body_bytes: number
  max_messages: number
  max_message_chars: number
  max_tokens: number
  timeout_ms: number
}

// Per-plan hard limits — enforced before any provider call
const PLAN_GUARDS: Record<Plan | 'test', GuardConfig> = {
  test: {
    max_body_bytes:    32 * 1024,   // 32KB
    max_messages:      20,
    max_message_chars: 4_000,
    max_tokens:        1_024,
    timeout_ms:        30_000,
  },
  free: {
    max_body_bytes:    32 * 1024,
    max_messages:      20,
    max_message_chars: 4_000,
    max_tokens:        1_024,
    timeout_ms:        30_000,
  },
  pro: {
    max_body_bytes:    128 * 1024,  // 128KB
    max_messages:      50,
    max_message_chars: 20_000,
    max_tokens:        8_192,
    timeout_ms:        120_000,
  },
  team: {
    max_body_bytes:    256 * 1024,  // 256KB
    max_messages:      100,
    max_message_chars: 50_000,
    max_tokens:        16_384,
    timeout_ms:        180_000,
  },
  enterprise: {
    max_body_bytes:    1024 * 1024, // 1MB
    max_messages:      200,
    max_message_chars: 100_000,
    max_tokens:        32_768,
    timeout_ms:        300_000,
  },
}

export function getGuard(plan: Plan, key_type: KeyType): GuardConfig {
  const effectivePlan: Plan | 'test' = key_type === 'test' ? 'test' : plan
  return PLAN_GUARDS[effectivePlan]
}

export interface Message {
  role: string
  content: string
}

export type ValidateBodyResult =
  | { ok: true; messages: Message[]; max_tokens: number }
  | { ok: false; error: string; status: number }

export function validateBody(
  raw: unknown,
  guard: GuardConfig,
): ValidateBodyResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Request body must be a JSON object', status: 400 }
  }

  const body = raw as Record<string, unknown>
  const messages = body['messages']
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'messages array required and must not be empty', status: 400 }
  }

  if (messages.length > guard.max_messages) {
    return { ok: false, error: `Too many messages. Maximum: ${guard.max_messages}`, status: 400 }
  }

  for (const msg of messages) {
    if (typeof msg !== 'object' || msg === null) {
      return { ok: false, error: 'Each message must be an object', status: 400 }
    }
    const m = msg as Record<string, unknown>
    if (typeof m['content'] !== 'string') {
      return { ok: false, error: 'Each message must have a string content field', status: 400 }
    }
    if (m['content'].length > guard.max_message_chars) {
      return {
        ok: false,
        error: `Message too long. Maximum: ${guard.max_message_chars.toLocaleString()} characters`,
        status: 400,
      }
    }
  }

  // Clamp max_tokens to plan ceiling
  const requested = typeof body['max_tokens'] === 'number' ? body['max_tokens'] : guard.max_tokens
  const max_tokens = Math.min(requested, guard.max_tokens)

  return { ok: true, messages: messages as Message[], max_tokens }
}

export function checkBodySize(contentLength: string | null, guard: GuardConfig): boolean {
  if (!contentLength) return true // can't check without header — validate after parse
  return Number(contentLength) <= guard.max_body_bytes
}
