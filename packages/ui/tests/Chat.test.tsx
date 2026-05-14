import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Chat } from '../src/components/Chat.js'
import type { Message } from '@react-ai-stream/core'

function msg(role: 'user' | 'assistant', content: string): Message {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date() }
}

describe('Chat component', () => {
  it('renders without crashing with empty messages', () => {
    const { container } = render(<Chat messages={[]} onSend={vi.fn()} />)
    expect(container.querySelector('.ras-chat')).toBeTruthy()
  })

  it('renders user and assistant messages', () => {
    const messages = [msg('user', 'Hello'), msg('assistant', 'Hi there')]
    render(<Chat messages={messages} onSend={vi.fn()} />)
    expect(screen.getByText('Hello')).toBeDefined()
    expect(screen.getByText('Hi there')).toBeDefined()
  })

  it('calls onSend when user presses Enter', () => {
    const onSend = vi.fn()
    render(<Chat messages={[]} onSend={onSend} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'test message' } })
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('test message')
  })

  it('applies custom className', () => {
    const { container } = render(<Chat messages={[]} onSend={vi.fn()} className="my-class" />)
    expect(container.querySelector('.ras-chat')!.className).toContain('my-class')
  })

  it('shows typing indicator when loading and no assistant content yet', () => {
    const messages = [msg('user', 'Hi')]
    const { container } = render(<Chat messages={messages} onSend={vi.fn()} loading />)
    expect(container.querySelector('.ras-typing')).toBeTruthy()
  })

  it('does not show typing indicator when assistant is already streaming content', () => {
    const messages = [msg('user', 'Hi'), { ...msg('assistant', 'typing...'), content: 'typing...' }]
    const { container } = render(<Chat messages={messages} onSend={vi.fn()} loading />)
    expect(container.querySelector('.ras-typing')).toBeNull()
  })
})
