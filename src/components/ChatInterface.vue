<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useClaude } from '@/composables/useClaude'
import { marked } from 'marked'

const {
  messages,
  isLoading,
  error,
  streamMessage,
  clearMessages
} = useClaude()

const inputMessage = ref('')
const chatContainer = ref<HTMLElement>()
const systemPrompt = ref('Ты опытный Vue.js и TypeScript разработчик.')
const temperature = ref(0.7)

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

watch(messages, scrollToBottom, { deep: true })

const handleSubmit = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const message = inputMessage.value
  inputMessage.value = ''

  try {
    await streamMessage(message, {
      systemPrompt: systemPrompt.value,
      temperature: temperature.value
    })
  } catch (e) {
    console.error('Failed to send message:', e)
  }
}

const formatMessage = (content: string): string => {
  return marked(content) as string
}
</script>

<template>
  <div class="chat-interface">
    <div class="chat-header">
      <h2>Claude Chat</h2>
      <button @click="clearMessages" :disabled="messages.length === 0">
        Очистить
      </button>
    </div>

    <div class="chat-settings">
      <div class="setting">
        <label for="system-prompt">System Prompt:</label>
        <textarea
          id="system-prompt"
          v-model="systemPrompt"
          rows="2"
          placeholder="Опиши роль Claude..."
        />
      </div>
      
      <div class="setting">
        <label for="temperature">
          Temperature: {{ temperature }}
        </label>
        <input
          id="temperature"
          v-model.number="temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>

    <div ref="chatContainer" class="chat-messages">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', `message-${message.role}`]"
      >
        <div class="message-header">
          <strong>{{ message.role === 'user' ? 'Вы' : 'Claude' }}</strong>
          <span class="message-time">
            {{ message.timestamp.toLocaleTimeString() }}
          </span>
        </div>
        <div
          class="message-content"
          v-html="formatMessage(message.content)"
        />
      </div>

      <div v-if="isLoading" class="message message-assistant loading">
        <div class="message-header">
          <strong>Claude</strong>
        </div>
        <div class="message-content">
          <span class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit" class="chat-input">
      <textarea
        v-model="inputMessage"
        placeholder="Напишите сообщение..."
        rows="3"
        @keydown.enter.exact.prevent="handleSubmit"
        :disabled="isLoading"
      />
      <button type="submit" :disabled="isLoading || !inputMessage.trim()">
        {{ isLoading ? 'Отправка...' : 'Отправить' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.chat-header h2 {
  margin: 0;
}

.chat-header button {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.chat-header button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-settings {
  padding: 1rem 0;
  display: flex;
  gap: 1rem;
  flex-direction: column;
}

.setting {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting label {
  font-weight: 500;
  font-size: 0.875rem;
}

.setting textarea {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-family: inherit;
  resize: vertical;
}

.setting input[type="range"] {
  width: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  padding: 1rem;
  border-radius: 0.5rem;
  max-width: 80%;
}

.message-user {
  align-self: flex-end;
  background: #3b82f6;
  color: white;
}

.message-assistant {
  align-self: flex-start;
  background: #f3f4f6;
  color: #1f2937;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.message-time {
  opacity: 0.7;
}

.message-content {
  line-height: 1.6;
}

.message-content :deep(pre) {
  background: #1f2937;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
}

.message-content :deep(code) {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

.typing-indicator {
  display: inline-flex;
  gap: 0.25rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #6b7280;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.chat-input {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.chat-input textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-family: inherit;
  resize: none;
}

.chat-input textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.chat-input button {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.chat-input button:hover:not(:disabled) {
  background: #2563eb;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>