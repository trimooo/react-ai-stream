import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { startMockServer } from '../src/mock-server.js'
import { runTests } from '../src/runner.js'

// Suppress console output from the runner during tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

const PORT = 3097

describe('compliance runner — normal scenario (should pass all)', () => {
  let stop: () => void

  beforeAll(async () => {
    stop = await startMockServer({ port: PORT, scenario: 'normal' })
  })

  afterAll(() => stop?.())

  it('returns zero failures', async () => {
    const result = await runTests(`http://localhost:${PORT}/api/chat`, [
      { role: 'user', content: 'hi' },
    ])
    expect(result.failed).toBe(0)
  })

  it('passes at least 9 tests', async () => {
    const result = await runTests(`http://localhost:${PORT}/api/chat`, [
      { role: 'user', content: 'hi' },
    ])
    expect(result.passed).toBeGreaterThanOrEqual(9)
  })
})

describe('compliance runner — error scenario (error termination is valid)', () => {
  let stop: () => void
  const errPort = PORT + 1

  beforeAll(async () => {
    stop = await startMockServer({ port: errPort, scenario: 'error' })
  })

  afterAll(() => stop?.())

  it('returns zero failures for error-terminated stream', async () => {
    const result = await runTests(`http://localhost:${errPort}/api/chat`, [
      { role: 'user', content: 'hi' },
    ])
    expect(result.failed).toBe(0)
  })
})

describe('compliance runner — no-done scenario (should fail)', () => {
  let stop: () => void
  const noDonePort = PORT + 2

  beforeAll(async () => {
    stop = await startMockServer({ port: noDonePort, scenario: 'no-done' })
  })

  afterAll(() => stop?.())

  it('detects at least 1 failure for no-done stream', async () => {
    const result = await runTests(`http://localhost:${noDonePort}/api/chat`, [
      { role: 'user', content: 'hi' },
    ])
    expect(result.failed).toBeGreaterThanOrEqual(1)
  })
})

describe('compliance runner — malformed scenario (should fail format check)', () => {
  let stop: () => void
  const badPort = PORT + 3

  beforeAll(async () => {
    stop = await startMockServer({ port: badPort, scenario: 'malformed' })
  })

  afterAll(() => stop?.())

  it('detects at least 1 failure for malformed stream', async () => {
    const result = await runTests(`http://localhost:${badPort}/api/chat`, [
      { role: 'user', content: 'hi' },
    ])
    expect(result.failed).toBeGreaterThanOrEqual(1)
  })
})

describe('compliance runner — chunked scenario (should pass core)', () => {
  let stop: () => void
  const chunkedPort = PORT + 4

  beforeAll(async () => {
    stop = await startMockServer({ port: chunkedPort, scenario: 'chunked' })
  })

  afterAll(() => stop?.())

  it('returns zero failures for chunked stream', async () => {
    const result = await runTests(`http://localhost:${chunkedPort}/api/chat`, [
      { role: 'user', content: 'hi' },
    ])
    expect(result.failed).toBe(0)
  })
})

describe('compliance runner — connection failure', () => {
  it('returns failed=1 when endpoint is unreachable', async () => {
    const result = await runTests('http://localhost:1/api/chat', [
      { role: 'user', content: 'hi' },
    ])
    expect(result.failed).toBe(1)
    expect(result.passed).toBe(0)
  })
})
