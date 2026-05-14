<script setup lang="ts">
import { ref } from 'vue'
import { useAIChat } from '@react-ai-stream/vue'

const { messages, sendMessage, loading, stop, error } = useAIChat({
  endpoint: 'http://localhost:3000/api/chat',
})

const input = ref('')

function handleSubmit() {
  if (!input.value.trim() || loading.value) return
  sendMessage(input.value)
  input.value = ''
}
</script>

<template>
  <div class="layout">
    <header>
      <h1>react-ai-stream — Vue Demo</h1>
      <p>Powered by <code>@react-ai-stream/vue</code> · <code>useAIChat</code> composable</p>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <ul class="messages">
      <li
        v-for="m in messages.filter(m => m.role !== 'system')"
        :key="m.id"
        :class="['message', m.role]"
      >
        <strong>{{ m.role }}</strong>
        <p>{{ m.content }}</p>
      </li>
      <li v-if="loading" class="message assistant thinking">Thinking…</li>
    </ul>

    <form class="input-row" @submit.prevent="handleSubmit">
      <input
        v-model="input"
        placeholder="Ask anything…"
        :disabled="loading"
      />
      <button v-if="loading" type="button" class="stop" @click="stop">Stop</button>
      <button v-else type="submit" :disabled="!input.trim()">Send</button>
    </form>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #fafafa; }

.layout {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100vh;
}

header h1 { font-size: 1.25rem; font-weight: 600; }
header p  { font-size: 0.85rem; color: #6b7280; margin-top: 0.25rem; }

.error { color: #dc2626; font-size: 0.875rem; }

.messages { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }

.message { padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e5e7eb; }
.message strong { display: block; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; margin-bottom: 4px; }
.message p { white-space: pre-wrap; font-size: 0.9rem; }
.message.user { background: #f3f4f6; }
.message.assistant { background: #fff; }
.message.thinking { color: #9ca3af; font-size: 0.875rem; font-style: italic; background: none; border-color: transparent; }

.input-row { display: flex; gap: 8px; }
.input-row input {
  flex: 1; padding: 0.6rem 0.875rem; border-radius: 6px;
  border: 1px solid #d1d5db; font-size: 0.9rem; outline: none;
}
.input-row input:focus { border-color: #3b82f6; }
.input-row button {
  padding: 0.6rem 1rem; border-radius: 6px; border: none;
  background: #3b82f6; color: #fff; cursor: pointer; font-size: 0.9rem;
}
.input-row button:disabled { opacity: 0.5; cursor: default; }
.input-row button.stop { background: #ef4444; }
</style>
