import { describe, it, expect } from 'vitest'
import {
  normalizeOpenAIChunk,
  normalizeAnthropicChunk,
  normalizeCustomChunk,
} from '../src/streaming/chunk-normalizer.js'

describe('normalizeOpenAIChunk', () => {
  it('extracts text from delta', () => {
    const raw = JSON.stringify({ choices: [{ delta: { content: 'Hello' }, finish_reason: null }] })
    expect(normalizeOpenAIChunk(raw)).toEqual({ type: 'text', text: 'Hello' })
  })

  it('returns done on stop', () => {
    const raw = JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })
    expect(normalizeOpenAIChunk(raw)).toEqual({ type: 'done' })
  })

  it('returns null for empty delta', () => {
    const raw = JSON.stringify({ choices: [{ delta: {}, finish_reason: null }] })
    expect(normalizeOpenAIChunk(raw)).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(normalizeOpenAIChunk('not-json')).toBeNull()
  })
})

describe('normalizeAnthropicChunk', () => {
  it('extracts text from content_block_delta', () => {
    const raw = JSON.stringify({
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'World' },
    })
    expect(normalizeAnthropicChunk(raw)).toEqual({ type: 'text', text: 'World' })
  })

  it('returns done on message_stop', () => {
    const raw = JSON.stringify({ type: 'message_stop' })
    expect(normalizeAnthropicChunk(raw)).toEqual({ type: 'done' })
  })

  it('returns null for other event types', () => {
    const raw = JSON.stringify({ type: 'message_start' })
    expect(normalizeAnthropicChunk(raw)).toBeNull()
  })
})

describe('normalizeCustomChunk', () => {
  it('passes through valid StreamChunk', () => {
    const raw = JSON.stringify({ type: 'text', text: 'hello' })
    expect(normalizeCustomChunk(raw)).toEqual({ type: 'text', text: 'hello' })
  })

  it('returns null for invalid JSON', () => {
    expect(normalizeCustomChunk('bad')).toBeNull()
  })
})
