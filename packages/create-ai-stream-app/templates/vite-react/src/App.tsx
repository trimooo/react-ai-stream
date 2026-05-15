import { useState } from 'react'
import { useAIChat } from '@react-ai-stream/react'

const ENDPOINT = import.meta.env.VITE_API_URL ?? '/api/chat'

export default function App() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, loading, stop, error } = useAIChat({ endpoint: ENDPOINT })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text)
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>__PROJECT_NAME__</h1>
        <p style={styles.subtitle}>Powered by react-ai-stream · RAIS Protocol</p>
      </header>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <p style={styles.empty}>Send a message to start chatting.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ ...styles.bubble, ...(m.role === 'user' ? styles.userBubble : styles.aiBubble) }}>
            {m.content || (loading && m.role === 'assistant' ? '▋' : '')}
          </div>
        ))}
        {error && <p style={styles.error}>{error}</p>}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
          style={styles.input}
          autoFocus
        />
        {loading ? (
          <button type="button" onClick={stop} style={{ ...styles.btn, background: '#ef4444' }}>Stop</button>
        ) : (
          <button type="submit" disabled={!input.trim()} style={styles.btn}>Send</button>
        )}
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' },
  header: { marginBottom: 24 },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700 },
  subtitle: { margin: 0, fontSize: 13, color: '#64748b' },
  messages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 80 },
  bubble: { maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  userBubble: { alignSelf: 'flex-end', background: '#3B5BFF', color: '#fff', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', background: '#f1f5f9', color: '#0f172a', borderBottomLeftRadius: 4 },
  error: { color: '#ef4444', fontSize: 13 },
  form: { display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #e2e8f0' },
  input: { flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn: { padding: '10px 20px', background: '#3B5BFF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
