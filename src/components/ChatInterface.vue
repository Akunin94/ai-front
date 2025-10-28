<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useClaude } from '@/composables/useClaude'
import { useChatHistory } from '@/composables/useChatHistory'

const {
  isLoading,
  error,
  streamMessage
} = useClaude()

const {
  sessions,
  currentSessionId,
  getCurrentSession,
  createSession,
  addMessage,
  switchSession,
  deleteSession,
  clearCurrentSession
} = useChatHistory()

const userInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const currentMessages = computed(() => {
  return getCurrentSession()?.messages || []
})

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleSubmit = async () => {
  const message = userInput.value.trim()
  if (!message || isLoading.value) return

  // Если нет текущей сессии - создать
  if (!currentSessionId.value) {
    createSession(message)
  }

  // Добавить сообщение пользователя
  addMessage('user', message)
  userInput.value = ''
  scrollToBottom()

  // Создать пустое сообщение ассистента для streaming
  addMessage('assistant', '')
  
  try {
    let fullResponse = ''
    
    // ← ВАЖНО: Передаем messages из текущей сессии
    const session = getCurrentSession()
    if (!session) return
    
    // Конвертируем в формат Claude API (без пустого последнего сообщения)
    const messagesForAPI = session.messages
      .slice(0, -1) // Убираем последнее пустое сообщение ассистента
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    
    await streamMessage((messagesForAPI as any), {
      onChunk: (chunk: string) => {
        fullResponse += chunk
        const currentSession = getCurrentSession()
        if (currentSession && currentSession.messages.length > 0) {
          const lastMessage = currentSession.messages[currentSession.messages.length - 1]
          if (lastMessage) {
            lastMessage.content = fullResponse
          }
        }
        scrollToBottom()
      }
    })
  } catch (err) {
    console.error('Error:', err)
    // Удалить пустое сообщение ассистента при ошибке
    const session = getCurrentSession()
    if (session && session.messages.length > 0) {
      const lastMessage = session.messages[session.messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content) {
        session.messages.pop()
      }
    }
  }
}

const handleNewChat = () => {
  createSession()
  scrollToBottom()
}

const handleSwitchSession = (sessionId: string) => {
  switchSession(sessionId)
  scrollToBottom()
}

const handleDeleteSession = (sessionId: string, event: Event) => {
  event.stopPropagation()
  if (confirm('Delete this chat?')) {
    deleteSession(sessionId)
  }
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return date.toLocaleDateString()
}

// Создать первую сессию при монтировании если её нет
onMounted(() => {
  if (sessions.value.length === 0) {
    createSession()
  } else if (!currentSessionId.value && sessions.value.length > 0) {
    switchSession(sessions.value[0].id)
  }
})
</script>

<template>
  <div class="chat-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <button @click="handleNewChat" class="new-chat-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New chat
        </button>
      </div>

      <div class="sessions-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          :class="['session-item', { active: session.id === currentSessionId }]"
          @click="handleSwitchSession(session.id)"
        >
          <div class="session-content">
            <div class="session-title">{{ session.title }}</div>
            <div class="session-date">{{ formatDate(session.updatedAt) }}</div>
          </div>
          <button 
            class="delete-btn"
            @click="(e) => handleDeleteSession(session.id, e)"
            title="Delete chat"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="chat-main">
      <div class="messages-container" ref="messagesContainer">
        <div v-if="currentMessages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <h2>Start a conversation</h2>
          <p>Ask me anything, and I'll help you out!</p>
        </div>

        <div
          v-for="message in currentMessages"
          :key="message.id"
          :class="['message', message.role]"
        >
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-container">
        <div v-if="error" class="error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="input-form">
          <textarea
            v-model="userInput"
            @keydown.enter.exact.prevent="handleSubmit"
            placeholder="Message Claude..."
            rows="1"
            class="message-input"
            :disabled="isLoading"
          />
          <button
            type="submit"
            class="send-button"
            :disabled="!userInput.trim() || isLoading"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 55px - 32px - 32px);
  background: var(--color-background);
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.new-chat-btn {
  width: 100%;
  padding: 10px 16px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  transition: background 0.2s;
}

.new-chat-btn:hover {
  background: var(--color-brand-dark);
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 0;
}

.session-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  position: relative;
}

.session-item:hover {
  background: var(--color-background-mute);
}

.session-item.active {
  background: var(--color-background-mute);
  border-left: 3px solid var(--color-brand);
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.session-date {
  font-size: 12px;
  color: var(--color-text-light);
}

.delete-btn {
  padding: 4px;
  background: none;
  border: none;
  color: var(--color-text-light);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: all 0.2s;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fee;
  color: #c00;
}

@media (prefers-color-scheme: dark) {
  .delete-btn:hover {
    background: #5c1a1a;
    color: #ff6b6b;
  }
}

/* Main chat */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 0;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--color-text-light);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--color-heading);
}

.message {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: var(--color-background-mute);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  color: var(--color-text);
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message.user .message-text {
  background: var(--color-background-mute);
  padding: 12px 16px;
  border-radius: 12px;
  display: inline-block;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-brand);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-10px); }
}

/* Input area */
.input-container {
  padding: 24px 24px 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
  flex-shrink: 0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
}

@media (prefers-color-scheme: dark) {
  .error-banner {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fecaca;
  }
}

.input-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  max-height: 200px;
  background: var(--color-background-soft);
  color: var(--color-text);
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: var(--color-brand);
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button {
  padding: 12px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background: var(--color-brand-dark);
  transform: translateY(-1px);
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>