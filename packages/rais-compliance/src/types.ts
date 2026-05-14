export interface RaisEvent {
  type: string
  text?: string
  error?: string
  [key: string]: unknown
}

export interface CollectedStream {
  headers: Record<string, string>
  events: RaisEvent[]
  rawLines: string[]
  statusCode: number
}

export interface TestResult {
  status: 'pass' | 'fail' | 'warn' | 'skip'
  message: string
}
