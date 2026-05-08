export class AIStreamError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AIStreamError'
  }
}

export class ProviderError extends AIStreamError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ProviderError'
  }
}

export class ParseError extends AIStreamError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ParseError'
  }
}

export function isAbortError(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false
  const name = (err as { name?: unknown }).name
  return name === 'AbortError' || name === 'DOMException'
}
