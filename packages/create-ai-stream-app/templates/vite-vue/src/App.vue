<script setup lang="ts">
import { ref } from 'vue'
import { useAIChat } from '@react-ai-stream/vue'

const ENDPOINT = import.meta.env.VITE_API_URL ?? '/api/chat'

const input = ref('')
const { messages, loading, error, sendMessage, stop } = useAIChat({ endpoint: ENDPOINT })

function handleSubmit() {
  const text = input.value.trim()
  if (!text || loading.value) return
  input.value = ''
  sendMessage(text)
}
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="title">__PROJECT_NAME__</h1>
      <p class="subtitle">Powered by react-ai-stream · RAIS Protocol</p>
    </header>

    <div class="messages">
      <p v-if="messages.length === 0" class="empty">Send a message to start chatting.</p>
      <div
        v-for="m in messages"
        :key="m.id"
        :class="['bubble', m.role === 'user' ? 'user-bubble' : 'ai-bubble']"
      >
        {{ m.content || (loading && m.role === 'assistant' ? '▋' : '') }}
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <form class="form" @submit.prevent="handleSubmit">
      <input
        v-model="input"
        placeholder="Type a message…"
        :disabled="loading"
        class="input"
        autofocus
      />
      <button v-if="loading" type="button" class="btn btn-stop" @click="stop">Stop</button>
      <button v-else type="submit" :disabled="!input.trim()" class="btn">Send</button>
    </form>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.page { max-width: 720px; margin: 0 auto; padding: 32px 20px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; height: 100vh; }
.header { margin-bottom: 24px; }
.title { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.subtitle { margin: 0; font-size: 13px; color: #64748b; }
.messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 16px; }
.empty { color: #94a3b8; text-align: center; margin-top: 80px; }
.bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
.user-bubble { align-self: flex-end; background: #3B5BFF; color: #fff; border-bottom-right-radius: 4px; }
.ai-bubble { align-self: flex-start; background: #f1f5f9; color: #0f172a; border-bottom-left-radius: 4px; }
.error { color: #ef4444; font-size: 13px; }
.form { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
.input { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
.btn { padding: 10px 20px; background: #3B5BFF; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-stop { background: #ef4444; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
