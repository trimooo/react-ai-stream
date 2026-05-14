import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from '../src/hooks/useCopyToClipboard.js'

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('initial state: copied is false', () => {
    const { result } = renderHook(() => useCopyToClipboard())
    expect(result.current.copied).toBe(false)
  })

  it('copied becomes true after copy()', async () => {
    const { result } = renderHook(() => useCopyToClipboard())
    await act(async () => { await result.current.copy('hello') })
    expect(result.current.copied).toBe(true)
  })

  it('calls navigator.clipboard.writeText with the given text', async () => {
    const { result } = renderHook(() => useCopyToClipboard())
    await act(async () => { await result.current.copy('test content') })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content')
  })

  it('resets copied to false after resetMs (default 2000ms)', async () => {
    const { result } = renderHook(() => useCopyToClipboard())
    await act(async () => { await result.current.copy('text') })
    expect(result.current.copied).toBe(true)
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.copied).toBe(false)
  })

  it('respects custom resetMs', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500))
    await act(async () => { await result.current.copy('text') })
    act(() => { vi.advanceTimersByTime(499) })
    expect(result.current.copied).toBe(true)
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current.copied).toBe(false)
  })

  it('second copy() resets the timer', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500))
    await act(async () => { await result.current.copy('first') })
    act(() => { vi.advanceTimersByTime(300) })
    await act(async () => { await result.current.copy('second') })
    act(() => { vi.advanceTimersByTime(300) })
    // Should still be true (timer was reset)
    expect(result.current.copied).toBe(true)
    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current.copied).toBe(false)
  })

  it('stays false if clipboard write fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    const { result } = renderHook(() => useCopyToClipboard())
    await act(async () => { await result.current.copy('text') })
    expect(result.current.copied).toBe(false)
  })
})
