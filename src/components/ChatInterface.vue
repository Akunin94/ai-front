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
const systemPrompt = ref('Ты опытный разработчик, специализирующийся на Vue.js, TypeScript и современном веб-разработке.')
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

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<template>
  <div class="chat-interface">
    <div class="page-header">
      <h1 class="page-title">Chat</h1>
      <p class="page-description">
        General purpose AI assistant powered by Claude
      </p>
    </div>

    <div class="chat-container">
      <div class="chat-settings">
        <div class="setting-group">
          <label class="setting-label">System Prompt</label>
          <textarea
            v-model="systemPrompt"
            rows="3"
            class="setting-input"
            placeholder="Define the AI's role and behavior..."
          />
        </div>
        
        <div class="setting-group">
          <label class="setting-label">
            Temperature: {{ temperature.toFixed(1) }}
          </label>
          <input
            v-model.number="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="setting-slider"
          />
        </div>

        <div class="setting-actions">
          <button 
            @click="clearMessages" 
            :disabled="messages.length === 0" 
            class="secondary-button"
          >
            Clear Messages
          </button>
        </div>
      </div>

      <div v-if="error" class="error-banner">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <div ref="chatContainer" class="messages-area">
        <div v-if="messages.length === 0" class="welcome-screen">
          <div class="welcome-icon">💬</div>
          <h2 class="welcome-title">Start a conversation</h2>
          <p class="welcome-text">
            Ask me anything about programming, Vue.js, or general topics
          </p>
          
          <div class="welcome-tips">
            <p class="tips-title"><strong>Example prompts:</strong></p>
            <ul class="tips-list">
              <li>Explain Vue 3 Composition API</li>
              <li>How to optimize React performance?</li>
              <li>Best practices for TypeScript</li>
            </ul>
          </div>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', `message-${message.role}`]"
        >
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-body">
            <div class="message-header">
              <span class="message-author">
                {{ message.role === 'user' ? 'You' : 'AI Assistant' }}
              </span>
              <span class="message-time">{{ formatDate(message.timestamp) }}</span>
            </div>
            
            <div 
              class="message-content markdown-content"
              v-html="formatMessage(message.content)"
            />
          </div>
        </div>

        <div v-if="isLoading" class="typing-indicator">
          <div class="message-avatar">🤖</div>
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div class="input-panel">
        <textarea
          v-model="inputMessage"
          placeholder="Type your message..."
          rows="1"
          @keydown.enter.exact.prevent="handleSubmit"
          :disabled="isLoading"
          class="input-textarea"
        />
        <button
          @click="handleSubmit"
          :disabled="isLoading || !inputMessage.trim()"
          class="send-button"
        >
          <span class="send-icon">{{ isLoading ? '⏳' : '➤' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-interface {
  width: 100%;
}

.page-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--color-heading);
}

.page-description {
  font-size: 18px;
  color: var(--color-text-light);
  margin: 0;
}

.chat-container {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.chat-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-heading);
}

.setting-input {
  padding: 10px 12px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  resize: vertical;
  transition: all 0.25s;
}

.setting-input:focus {
  outline: none;
  border-color: var(--color-brand);
  background: var(--color-background);
}

.setting-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-background-mute);
  border-radius: 3px;
  outline: none;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--color-brand);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.25s;
}

.setting-slider::-webkit-slider-thumb:hover {
  background: var(--color-brand-dark);
  transform: scale(1.1);
}

.setting-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--color-brand);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.25s;
}

.setting-slider::-moz-range-thumb:hover {
  background: var(--color-brand-dark);
  transform: scale(1.1);
}

.setting-actions {
  display: flex;
  gap: 12px;
}

.secondary-button {
  padding: 8px 16px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.25s;
}

.secondary-button:hover:not(:disabled) {
  border-color: var(--color-border-hover);
  background: var(--color-background-soft);
}

.secondary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  color: #991b1b;
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.messages-area {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  padding: 24px;
}

.welcome-screen {
  max-width: 600px;
  margin: 60px auto;
  text-align: center;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-heading);
}

.welcome-text {
  font-size: 16px;
  color: var(--color-text-light);
  margin-bottom: 32px;
}

.welcome-tips {
  text-align: left;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}

.tips-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--color-heading);
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  padding: 8px 0;
  font-size: 14px;
  color: var(--color-text-light);
}

.tips-list li::before {
  content: '→ ';
  color: var(--color-brand);
  font-weight: bold;
  margin-right: 8px;
}

.message {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.message-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 50%;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.message-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-heading);
}

.message-time {
  font-size: 12px;
  color: var(--color-text-light);
}

.message-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text);
}

.markdown-content :deep(p) {
  margin: 0 0 12px 0;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(code) {
  padding: 2px 6px;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.9em;
  color: var(--color-brand-dark);
}

.markdown-content :deep(pre) {
  background: var(--vt-c-black-soft);
  color: #e5e7eb;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-content :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
}

.typing-indicator {
  display: flex;
  gap: 16px;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: var(--color-brand);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-6px);
  }
}

.input-panel {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.input-textarea {
  flex: 1;
  min-height: 44px;
  max-height: 200px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  resize: vertical;
  transition: all 0.25s;
}

.input-textarea:focus {
  outline: none;
  border-color: var(--color-brand);
  background: var(--color-background);
}

.input-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-textarea::placeholder {
  color: var(--color-text-light);
}

.send-button {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
}

.send-button:hover:not(:disabled) {
  background: var(--color-brand-dark);
  transform: translateY(-1px);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-icon {
  font-size: 18px;
  color: white;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 28px;
  }
  
  .page-description {
    font-size: 16px;
  }
}
</style>