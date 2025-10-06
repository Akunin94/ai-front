<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRAG } from '@/composables/useRAG'
import { marked } from 'marked'

const {
  messages,
  uploadedFiles,
  isUploading,
  isQuerying,
  uploadProgress,
  error,
  hasDocuments,
  totalChunks,
  uploadDocument,
  askQuestion,
  loadDocuments,
  clearAllDocuments,
  clearMessages
} = useRAG()

const fileInput = ref<HTMLInputElement>()
const question = ref('')
const chatContainer = ref<HTMLElement>()
const showUploadZone = ref(true)

onMounted(() => {
  loadDocuments()
})

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    try {
      await uploadDocument(file)
      // Очищаем input
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    } catch (e) {
      console.error('Upload error:', e)
    }
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  
  if (file) {
    try {
      await uploadDocument(file)
    } catch (e) {
      console.error('Upload error:', e)
    }
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleAskQuestion = async () => {
  if (!question.value.trim() || isQuerying.value || !hasDocuments.value) return

  const q = question.value
  question.value = ''

  try {
    await askQuestion(q)
    scrollToBottom()
  } catch (e) {
    console.error('Query error:', e)
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }, 100)
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

const handleClearAll = async () => {
  if (confirm('Удалить все документы и историю чата?')) {
    try {
      await clearAllDocuments()
    } catch (e) {
      console.error('Clear error:', e)
    }
  }
}

const getSupportedFormats = () => {
  return 'PDF, DOCX, TXT, MD (макс. 10MB)'
}
</script>

<template>
  <div class="document-qa">
    <!-- Sidebar с документами -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>📚 Документы</h3>
        <button 
          v-if="hasDocuments"
          @click="handleClearAll"
          class="clear-all-btn"
          title="Удалить все"
        >
          🗑️
        </button>
      </div>

      <div class="upload-section">
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.docx,.txt,.md"
          @change="handleFileSelect"
          style="display: none"
        />
        
        <button
          @click="fileInput?.click()"
          :disabled="isUploading"
          class="upload-btn"
        >
          {{ isUploading ? '⏳ Загрузка...' : '➕ Загрузить документ' }}
        </button>

        <div
          v-if="showUploadZone"
          class="drop-zone"
          @drop="handleDrop"
          @dragover="handleDragOver"
        >
          <div class="drop-zone-content">
            <span class="drop-icon">📄</span>
            <p>Перетащи файл сюда</p>
            <span class="formats">{{ getSupportedFormats() }}</span>
          </div>
        </div>

        <div v-if="isUploading" class="upload-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: `${uploadProgress}%` }"
            />
          </div>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>
      </div>

      <div class="documents-list">
        <div v-if="uploadedFiles.length === 0" class="empty-state">
          <p>Загрузи документы чтобы начать</p>
        </div>

        <div
          v-for="file in uploadedFiles"
          :key="file.filename"
          class="document-item"
        >
          <div class="document-icon">
            {{ file.filename.endsWith('.pdf') ? '📕' : 
               file.filename.endsWith('.docx') ? '📘' : 
               file.filename.endsWith('.md') ? '📗' : '📄' }}
          </div>
          <div class="document-info">
            <div class="document-name" :title="file.filename">
              {{ file.filename }}
            </div>
            <div class="document-meta">
              {{ file.chunks }} частей
            </div>
          </div>
        </div>

        <div v-if="hasDocuments" class="documents-summary">
          Всего: {{ uploadedFiles.length }} файлов, {{ totalChunks }} частей
        </div>
      </div>
    </aside>

    <!-- Основная область чата -->
    <main class="chat-area">
      <div class="chat-header">
        <div>
          <h2>💬 Спроси у документов</h2>
          <p v-if="hasDocuments">
            Задай вопрос по загруженным документам
          </p>
          <p v-else class="warning">
            ⚠️ Сначала загрузи документы
          </p>
        </div>
        <button
          v-if="messages.length > 0"
          @click="clearMessages"
          class="clear-chat-btn"
        >
          Очистить чат
        </button>
      </div>

      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div ref="chatContainer" class="messages-container">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">🤖</div>
          <h3>Привет! Я помогу найти информацию в твоих документах</h3>
          <p>Загрузи документы слева и задай любой вопрос</p>
          
          <div class="example-questions">
            <p><strong>Примеры вопросов:</strong></p>
            <ul>
              <li>О чем говорится в документе?</li>
              <li>Какие ключевые моменты упоминаются?</li>
              <li>Найди информацию о [конкретная тема]</li>
            </ul>
          </div>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', `message-${message.role}`]"
        >
          <div class="message-content">
            <div class="message-header">
              <strong>{{ message.role === 'user' ? '👤 Вы' : '🤖 AI' }}</strong>
              <span class="message-time">{{ formatDate(message.timestamp) }}</span>
            </div>
            
            <div 
              class="message-text markdown-body"
              v-html="formatMessage(message.content)"
            />

            <div v-if="message.sources && message.sources.length > 0" class="sources">
              <div class="sources-header">
                <span class="sources-icon">📎</span>
                <strong>Источники:</strong>
              </div>
              <div class="sources-list">
                <div
                  v-for="(source, index) in message.sources"
                  :key="index"
                  class="source-item"
                >
                  <div class="source-header">
                    <span class="source-filename">{{ source.metadata.filename }}</span>
                    <span v-if="source.metadata.page" class="source-page">
                      стр. {{ source.metadata.page }}
                    </span>
                  </div>
                  <div class="source-preview">
                    {{ source.content.substring(0, 150) }}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isQuerying" class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div class="input-area">
        <textarea
          v-model="question"
          placeholder="Задай вопрос по документам..."
          rows="3"
          @keydown.enter.exact.prevent="handleAskQuestion"
          :disabled="isQuerying || !hasDocuments"
        />
        <button
          @click="handleAskQuestion"
          :disabled="isQuerying || !question.trim() || !hasDocuments"
          class="send-btn"
        >
          {{ isQuerying ? '⏳' : '🚀' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.document-qa {
  display: flex;
  height: 100%;
  background: #f9fafb;
}

/* Sidebar */
.sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
}

.clear-all-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.clear-all-btn:hover {
  opacity: 1;
}

.upload-section {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.upload-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 1rem;
}

.upload-btn:hover:not(:disabled) {
  background: #2563eb;
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drop-zone {
  padding: 1.5rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.drop-zone:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.drop-icon {
  font-size: 2rem;
}

.drop-zone-content p {
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

.formats {
  font-size: 0.75rem;
  color: #9ca3af;
}

.upload-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  display: block;
}

.documents-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}

.document-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
}

.document-item:hover {
  background: #f3f4f6;
}

.document-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-name {
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}

.document-meta {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.documents-summary {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1e40af;
  text-align: center;
  font-weight: 500;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.chat-header h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.chat-header p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.chat-header p.warning {
  color: #f59e0b;
  font-weight: 500;
}

.clear-chat-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.875rem;
}

.clear-chat-btn:hover {
  background: #dc2626;
}

.error-message {
  margin: 1rem;
  padding: 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.5rem;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
}

.welcome-message {
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
}

.welcome-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.welcome-message h3 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.welcome-message > p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.example-questions {
  text-align: left;
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.example-questions p {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.example-questions ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #6b7280;
}

.example-questions li {
  margin-bottom: 0.5rem;
}

.message {
  margin-bottom: 1.5rem;
  display: flex;
}

.message-user {
  justify-content: flex-end;
}

.message-user .message-content {
  background: #3b82f6;
  color: white;
}

.message-assistant .message-content {
  background: white;
  border: 1px solid #e5e7eb;
}

.message-content {
  max-width: 70%;
  padding: 1rem;
  border-radius: 0.75rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.message-time {
  opacity: 0.7;
  font-size: 0.75rem;
}

.message-text {
  line-height: 1.6;
}

.markdown-body :deep(p) {
  margin: 0 0 0.75rem 0;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.message-user .markdown-body :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.markdown-body :deep(pre) {
  background: #1f2937;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.sources {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.sources-icon {
  font-size: 1rem;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.source-item {
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.source-filename {
  font-weight: 600;
  color: #3b82f6;
}

.source-page {
  font-size: 0.75rem;
  color: #6b7280;
}

.source-preview {
  color: #6b7280;
  line-height: 1.4;
}

.typing-indicator {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #3b82f6;
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

.input-area {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.input-area textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  transition: border-color 0.2s;
}

.input-area textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.input-area textarea:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.send-btn {
  padding: 0 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>