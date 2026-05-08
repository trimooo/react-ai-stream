import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIChat } from '../src/hooks/useAIChat.js'
import type { AIClient, StreamChunk, Message } from '@react-ai-stream/core'

function makeMockClient(chunks: StreamChunk[]): AIClient {
  return {
    provider: {
      async *stream(_messages: Message[], _signal: AbortSignal) {
        for (const chunk of chunks) {
          yield chunk
        }
      },
    },
  }
}

describe('useAIChat', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useAIChat({ client: makeMockClient([]) }))

    expect(result.current.messages).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('adds user and streamed assistant messages', async () => {
    const client = makeMockClient([
      { type: 'text', text: 'Hi ' },
      { type: 'text', text: 'there!' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'Hello' })
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', content: 'Hi there!' })
  })

  it('loading is false after streaming completes', async () => {
    const client = makeMockClient([{ type: 'text', text: 'ok' }, { type: 'done' }])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('test')
    })

    expect(result.current.loading).toBe(false)
  })

  it('sets error state when provider yields an error chunk', async () => {
    const client = makeMockClient([{ type: 'error', error: 'API quota exceeded' }])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('test')
    })

    expect(result.current.error).toBe('API quota exceeded')
    expect(result.current.loading).toBe(false)
  })

  it('clearMessages empties the message list', async () => {
    const client = makeMockClient([{ type: 'done' }])
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      await result.current.sendMessage('hello')
    })

    expect(result.current.messages.length).toBeGreaterThan(0)

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toEqual([])
  })

  it('stop() sets loading to false and aborts the stream', async () => {
    const client: AIClient = {
      provider: {
        async *stream(_messages: Message[], signal: AbortSignal) {
          await new Promise<void>((_resolve, reject) => {
            signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          })
        },
      },
    }
    const { result } = renderHook(() => useAIChat({ client }))

    act(() => {
      void result.current.sendMessage('test')
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    act(() => {
      result.current.stop()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('ignores duplicate sendMessage calls while loading', async () => {
    let callCount = 0
    const client: AIClient = {
      provider: {
        async *stream(_messages: Message[], _signal: AbortSignal) {
          callCount++
          yield { type: 'done' }
        },
      },
    }
    const { result } = renderHook(() => useAIChat({ client }))

    await act(async () => {
      const first = result.current.sendMessage('first')
      void result.current.sendMessage('second')
      await first
    })

    expect(callCount).toBe(1)
  })
})
