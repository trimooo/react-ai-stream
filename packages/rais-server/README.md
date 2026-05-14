# rais-server

Zero-config reference server for the [RAIS Protocol v1](https://github.com/trimooo/react-ai-stream).

Stream AI responses from OpenAI, Anthropic, or Groq with a single command — no code required.

[![npm](https://img.shields.io/npm/v/rais-server)](https://www.npmjs.com/package/rais-server)
[![RAIS v1](https://img.shields.io/badge/RAIS-v1%20Recommended-22c55e)](https://github.com/trimooo/react-ai-stream)

## Usage

```bash
# OpenAI
OPENAI_API_KEY=sk-... npx rais-server

# Anthropic
ANTHROPIC_API_KEY=sk-ant-... npx rais-server

# Groq
GROQ_API_KEY=gsk_... npx rais-server

# Server starts on http://localhost:3001/api/chat
```

## Options

```bash
npx rais-server \
  --provider anthropic \
  --model claude-sonnet-4-6 \
  --port 4000 \
  --system "You are concise" \
  --max-tokens 256 \
  --no-cors
```

| Flag | Default | Description |
|---|---|---|
| `--provider` | auto-detected | `openai`, `anthropic`, or `groq` |
| `--model` | provider default | Model name |
| `--port` | `3001` | Port to listen on |
| `--system` | — | System prompt |
| `--max-tokens` | `1024` | Max tokens (Anthropic / Groq) |
| `--no-cors` | CORS enabled | Disable CORS headers |

Provider is auto-detected from environment variables: `ANTHROPIC_API_KEY` takes priority, then `OPENAI_API_KEY`, then `GROQ_API_KEY`.

## Test your endpoint

```bash
# Send a message
curl -N -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"say hello in one word"}]}'

# Run full compliance check
npx rais-compliance http://localhost:3001/api/chat
```

## Point useAIChat at it

```tsx
import { useAIChat } from '@react-ai-stream/react'

const { messages, sendMessage } = useAIChat({
  endpoint: 'http://localhost:3001/api/chat',
})
```

## Wire format

Every response is a RAIS-compliant SSE stream:

```
data: {"type":"text","text":"Hello"}

data: {"type":"text","text":"!"}

data: {"type":"done"}
```

## License

MIT — part of [react-ai-stream](https://github.com/trimooo/react-ai-stream)
