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

onMounted(() => {
  loadDocuments()
})

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    try {
      await uploadDocument(file)
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
</script>

<template>
  <div class="document-qa">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-content">
        <h1 class="page-title">Document Q&A</h1>
        <p class="page-description">
          Upload your documents and ask questions. AI will find answers with sources.
        </p>
      </div>
    </div>

    <div class="qa-layout">
      <!-- Sidebar -->
      <aside class="qa-sidebar">
        <div class="sidebar-section">
          <h3 class="sidebar-title">Documents</h3>
          
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
            class="upload-button"
          >
            <span class="button-icon">📁</span>
            {{ isUploading ? 'Uploading...' : 'Upload Document' }}
          </button>

          <div
            class="drop-zone"
            @drop="handleDrop"
            @dragover="handleDragOver"
          >
            <p class="drop-zone-text">or drop file here</p>
            <p class="drop-zone-formats">PDF, DOCX, TXT, MD</p>
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

        <div class="sidebar-section">
          <div class="sidebar-header">
            <h4 class="sidebar-subtitle">Uploaded Files</h4>
            <button
              v-if="hasDocuments"
              @click="handleClearAll"
              class="clear-button"
              title="Clear all"
            >
              Clear
            </button>
          </div>

          <div v-if="uploadedFiles.length === 0" class="empty-state">
            <p>No documents yet</p>
          </div>

          <div v-else class="documents-list">
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
                  {{ file.chunks }} chunks
                </div>
              </div>
            </div>

            <div class="documents-summary">
              {{ uploadedFiles.length }} files · {{ totalChunks }} chunks
            </div>
          </div>
        </div>
      </aside>

      <!-- Chat Area -->
      <main class="qa-main">
        <div v-if="error" class="error-banner">
          <span class="error-icon">⚠️</span>
          <span>{{ error }}</span>
        </div>

        <div ref="chatContainer" class="messages-area">
          <div v-if="messages.length === 0" class="welcome-screen">
            <div class="welcome-icon">🤖</div>
            <h2 class="welcome-title">Ask questions about your documents</h2>
            <p class="welcome-text">
              Upload documents on the left and start asking questions
            </p>
            
            <div class="welcome-tips">
              <p class="tips-title"><strong>Example questions:</strong></p>
              <ul class="tips-list">
                <li>What is this document about?</li>
                <li>Summarize the main points</li>
                <li>Find information about [specific topic]</li>
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

              <div v-if="message.sources && message.sources.length > 0" class="message-sources">
                <div class="sources-header">
                  <span class="sources-icon">📎</span>
                  <span class="sources-title">Sources</span>
                </div>
                <div class="sources-list">
                  <div
                    v-for="(source, index) in message.sources"
                    :key="index"
                    class="source-card"
                  >
                    <div class="source-header">
                      <span class="source-name">{{ source.metadata.filename }}</span>
                      <span v-if="source.metadata.page" class="source-page">
                        p. {{ source.metadata.page }}
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
            v-model="question"
            placeholder="Ask a question about your documents..."
            rows="1"
            @keydown.enter.exact.prevent="handleAskQuestion"
            :disabled="isQuerying || !hasDocuments"
            class="input-textarea"
          />
          <button
            @click="handleAskQuestion"
            :disabled="isQuerying || !question.trim() || !hasDocuments"
            class="send-button"
          >
            <span class="send-icon">{{ isQuerying ? '⏳' : '➤' }}</span>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.document-qa {
  width: 100%;
}

/* Page Header */
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

/* Layout */
.qa-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  align-items: start;
}

/* Sidebar */
.qa-sidebar {
  position: sticky;
  top: calc(var(--header-height) + 32px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-heading);
}

.sidebar-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-heading);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.upload-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.upload-button:hover:not(:disabled) {
  background: var(--color-brand-dark);
}

.upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-icon {
  font-size: 16px;
}

.drop-zone {
  margin-top: 12px;
  padding: 20px;
  border: 2px dashed var(--color-border);
  border-radius: 6px;
  text-align: center;
  transition: all 0.25s;
  cursor: pointer;
}

.drop-zone:hover {
  border-color: var(--color-brand);
  background: var(--color-background);
}

.drop-zone-text {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: var(--color-text-light);
}

.drop-zone-formats {
  margin: 0;
  font-size: 12px;
  color: var(--vt-c-gray-light-1);
}

.upload-progress {
  margin-top: 12px;
}

.progress-bar {
  height: 4px;
  background: var(--color-background-mute);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--color-brand);
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: var(--color-text-light);
}

.clear-button {
  padding: 4px 10px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-light);
  cursor: pointer;
  transition: all 0.25s;
}

.clear-button:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  transition: all 0.25s;
}

.document-item:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-1);
}

.document-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 2px;
}

.documents-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-light);
  text-align: center;
}

/* Main Chat Area */
.qa-main {
  display: flex;
  flex-direction: column;
  min-height: 600px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  color: #991b1b;
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.messages-area {
  flex: 1;
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

/* Messages */
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

/* Message Sources */
.message-sources {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.sources-icon {
  font-size: 14px;
}

.sources-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-heading);
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-card {
  padding: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 13px;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.source-name {
  font-weight: 600;
  color: var(--color-brand);
}

.source-page {
  font-size: 12px;
  color: var(--color-text-light);
}

.source-preview {
  color: var(--color-text-light);
  line-height: 1.5;
}

/* Typing Indicator */
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

/* Input Panel */
.input-panel {
  display: flex;
  gap: 12px;
  padding: 20px;
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

/* Responsive */
@media (max-width: 1024px) {
  .qa-layout {
    grid-template-columns: 280px 1fr;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .qa-layout {
    grid-template-columns: 1fr;
  }
  
  .qa-sidebar {
    position: static;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .page-description {
    font-size: 16px;
  }
}
</style>