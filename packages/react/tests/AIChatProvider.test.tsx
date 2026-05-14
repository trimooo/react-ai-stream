import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { AIChatProvider } from '../src/context/AIChatProvider.js'
import { AIChatContext } from '../src/context/AIChatContext.js'
import type { AIClient } from '@react-ai-stream/core'

function ClientProbe() {
  const client = useContext(AIChatContext)
  return <div data-testid="probe">{client ? 'has-client' : 'null'}</div>
}

describe('AIChatProvider', () => {
  it('provides the client via context', () => {
    const client: AIClient = { provider: { stream: vi.fn() } }
    render(
      <AIChatProvider client={client}>
        <ClientProbe />
      </AIChatProvider>,
    )
    expect(screen.getByTestId('probe').textContent).toBe('has-client')
  })

  it('context is null outside provider', () => {
    render(<ClientProbe />)
    expect(screen.getByTestId('probe').textContent).toBe('null')
  })

  it('renders children', () => {
    const client: AIClient = { provider: { stream: vi.fn() } }
    render(
      <AIChatProvider client={client}>
        <span data-testid="child">hello</span>
      </AIChatProvider>,
    )
    expect(screen.getByTestId('child')).toBeDefined()
  })

  it('passes exact client reference through context', () => {
    const client: AIClient = { provider: { stream: vi.fn() } }
    let captured: AIClient | null = null
    function Capturer() {
      captured = useContext(AIChatContext)
      return null
    }
    render(
      <AIChatProvider client={client}>
        <Capturer />
      </AIChatProvider>,
    )
    expect(captured).toBe(client)
  })
})
