import type { StreamChunk } from '../types.js'

export function normalizeOpenAIChunk(raw: string): StreamChunk | null {
  try {
    const parsed = JSON.parse(raw) as {
      choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>
      error?: { message: string }
    }
    if (parsed.error) return { type: 'error', error: parsed.error.message }
    const choice = parsed.choices?.[0]
    if (!choice) return null
    if (choice.finish_reason === 'stop' || choice.finish_reason === 'length') {
      return { type: 'done' }
    }
    const text = choice.delta?.content
    if (text) return { type: 'text', text }
    return null
  } catch {
    return null
  }
}

export function normalizeAnthropicChunk(raw: string): StreamChunk | null {
  try {
    const parsed = JSON.parse(raw) as {
      type?: string
      delta?: { type?: string; text?: string }
      error?: { message: string }
    }
    if (parsed.error) return { type: 'error', error: parsed.error.message }
    if (parsed.type === 'message_stop') return { type: 'done' }
    if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
      const text = parsed.delta.text
      if (text) return { type: 'text', text }
    }
    return null
  } catch {
    return null
  }
}

export function normalizeCustomChunk(raw: string): StreamChunk | null {
  try {
    return JSON.parse(raw) as StreamChunk
  } catch {
    return null
  }
}
