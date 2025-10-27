<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { projectStorage, type ProjectMetadata } from '@/services/projectStorage.service'
import { projectParser } from '@/services/projectParser.service'
import { useClaude } from '@/composables/useClaude'

const isLoading = ref(false)
const error = ref<string | null>(null)
const metadata = ref<ProjectMetadata | null>(null)
const isDragging = ref(false)

// Chat state
const userInput = ref('')
const messages = ref<Array<{ role: 'user' | 'assistant', content: string }>>([])
const messagesContainer = ref<HTMLElement | null>(null)

const { isLoading: isChatLoading, error: chatError, streamMessage } = useClaude()

const hasProject = computed(() => metadata.value !== null)

const formatSize = (bytes: number): string => {
  return projectParser.formatSize(bytes)
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

const scrollToBottom = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const loadMetadata = async () => {
  try {
    metadata.value = await projectStorage.getMetadata()
  } catch (err) {
    console.error('Error loading metadata:', err)
  }
}

const handleChatSubmit = async () => {
  if (!userInput.value.trim() || isChatLoading.value || !hasProject.value) return

  const userMessage = userInput.value.trim()
  
  // Добавляем сообщение пользователя
  messages.value.push({ role: 'user', content: userMessage })
  userInput.value = ''
  scrollToBottom()

  // Добавляем пустое сообщение ассистента для streaming
  messages.value.push({ role: 'assistant', content: '' })
  
  try {
    // Получаем все файлы проекта
    const allFiles = await projectStorage.getAllFiles()
    
    // Формируем context с файлами проекта
    const projectContext = `# Project Context\n\n${metadata.value!.structure}\n\n## Available Files:\n${
      allFiles.map(f => `### ${f.path}\n\`\`\`${f.type}\n${f.content}\n\`\`\`\n`).join('\n')
    }`

    // Создаём messages для API
    const apiMessages = messages.value.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }))

    let fullResponse = ''
    
    await streamMessage(apiMessages, {
      systemPrompt: projectContext,
      onChunk: (chunk: string) => {
        fullResponse += chunk
        const lastMessage = messages.value[messages.value.length - 1]
        lastMessage.content = fullResponse
        scrollToBottom()
      }
    })
  } catch (err) {
    console.error('Chat error:', err)
    // Удаляем пустое сообщение при ошибке
    if (messages.value[messages.value.length - 1].content === '') {
      messages.value.pop()
    }
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  if (!event.dataTransfer?.items) return

  for (const item of event.dataTransfer.items) {
    if (item.kind === 'file') {
      const entry = await item.getAsFileSystemHandle()
      if (entry && entry.kind === 'directory') {
        await processDirectory(entry as FileSystemDirectoryHandle)
        return
      }
    }
  }

  error.value = 'Please drop a folder, not individual files'
}

const handleBrowse = async () => {
  try {
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker()
    await processDirectory(dirHandle)
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Error selecting directory:', err)
      error.value = 'Failed to select directory'
    }
  }
}

const processDirectory = async (dirHandle: FileSystemDirectoryHandle) => {
  isLoading.value = true
  error.value = null
  messages.value = [] // Очищаем чат при новом проекте

  try {
    const { files, structure, metadata: projectMetadata } = await projectParser.parseDirectory(dirHandle)

    await projectStorage.clearAll()
    await projectStorage.saveFiles(files)
    await projectStorage.saveMetadata(projectMetadata)

    await createEmbeddings(files)

    metadata.value = projectMetadata

    console.log(`✅ Project loaded: ${files.length} files, ${formatSize(projectMetadata.totalSize)}`)
  } catch (err) {
    console.error('Error processing directory:', err)
    error.value = err instanceof Error ? err.message : 'Failed to process directory'
  } finally {
    isLoading.value = false
  }
}

const createEmbeddings = async (files: any[]) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    
    const response = await fetch(`${API_URL}/api/project/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: files.map(f => ({
          path: f.path,
          content: f.content
        }))
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create embeddings')
    }

    const data = await response.json()
    console.log(`✅ Embeddings created for ${data.documentsAdded} files`)
  } catch (err) {
    console.warn('Failed to create embeddings:', err)
  }
}

const handleClearProject = async () => {
  if (!confirm('Are you sure you want to remove this project?')) {
    return
  }

  try {
    await projectStorage.clearAll()
    metadata.value = null
    messages.value = []
    console.log('✅ Project cleared')
  } catch (err) {
    console.error('Error clearing project:', err)
    error.value = 'Failed to clear project'
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

onMounted(() => {
  loadMetadata()
})
</script>

<template>
  <div class="project-page">
    <!-- Left: Project Info -->
    <aside class="project-sidebar">
      <div class="sidebar-content">
        <div class="project-header">
          <h1>Project Manager</h1>
          <p class="subtitle">Upload your project folder</p>
        </div>

        <!-- Error banner -->
        <div v-if="error" class="error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
          <button @click="error = null" class="close-btn">×</button>
        </div>

        <!-- Upload area -->
        <div v-if="!hasProject || isLoading" class="upload-section">
          <div
            :class="['drop-zone', { dragging: isDragging, loading: isLoading }]"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
          >
            <div v-if="isLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Processing...</p>
            </div>
            
            <div v-else class="drop-content">
              <div class="drop-icon">📁</div>
              <p class="drop-text">Drop folder here</p>
              <button @click="handleBrowse" class="browse-btn">Browse</button>
            </div>
          </div>
        </div>

        <!-- Project info -->
        <div v-if="hasProject && !isLoading" class="project-info">
          <div class="info-header">
            <h2>📦 {{ metadata!.name }}</h2>
            <button @click="handleClearProject" class="icon-btn" title="Remove project">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>

          <div class="info-stats">
            <div class="stat">
              <span class="stat-value">{{ metadata!.totalFiles }}</span>
              <span class="stat-label">Files</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatSize(metadata!.totalSize) }}</span>
              <span class="stat-label">Size</span>
            </div>
          </div>

          <div class="structure-section">
            <h3>Structure</h3>
            <div class="structure-content">
              <pre>{{ metadata!.structure }}</pre>
            </div>
          </div>

          <button @click="handleBrowse" class="reload-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
            </svg>
            Reload
          </button>
        </div>
      </div>
    </aside>

    <!-- Right: Chat -->
    <main class="chat-area">
      <div v-if="!hasProject" class="empty-chat">
        <div class="empty-icon">📦</div>
        <h2>Upload a project to start</h2>
        <p>Chat with AI about your codebase with full context</p>
      </div>

      <div v-else class="chat-container">
        <div class="messages-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-state">
            <div class="empty-icon">💬</div>
            <h2>Ask about your project</h2>
            <p>AI has access to all {{ metadata!.totalFiles }} files</p>
          </div>

          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message', message.role]"
          >
            <div class="message-avatar">
              {{ message.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
            </div>
          </div>

          <div v-if="isChatLoading" class="message assistant">
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
          <div v-if="chatError" class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ chatError }}
          </div>

          <form @submit.prevent="handleChatSubmit" class="input-form">
            <textarea
              v-model="userInput"
              @keydown.enter.exact.prevent="handleChatSubmit"
              placeholder="Ask about your project..."
              rows="1"
              class="message-input"
              :disabled="isChatLoading"
            />
            <button
              type="submit"
              class="send-button"
              :disabled="!userInput.trim() || isChatLoading"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.project-page {
  display: flex;
  height: calc(100vh - 120px);
  background: var(--color-background);
  overflow: hidden;
}

/* Sidebar */
.project-sidebar {
  width: 380px;
  background: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 0;
}

.project-header {
  margin-bottom: 24px;
}

.project-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-light);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
  position: relative;
}

@media (prefers-color-scheme: dark) {
  .error-banner {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fecaca;
  }
}

.close-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 20px;
  color: inherit;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.close-btn:hover {
  opacity: 1;
}

.upload-section {
  margin-bottom: 24px;
}

.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s;
  background: var(--color-background);
}

.drop-zone.dragging {
  border-color: var(--color-brand);
  background: var(--color-background-mute);
}

.drop-zone.loading {
  border-style: solid;
  border-color: var(--color-brand);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-background-mute);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.drop-icon {
  font-size: 48px;
}

.drop-text {
  font-size: 14px;
  color: var(--color-text);
  margin: 0;
}

.browse-btn {
  padding: 8px 20px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.browse-btn:hover {
  background: var(--color-brand-dark);
}

.project-info {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.info-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.icon-btn {
  padding: 6px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

@media (prefers-color-scheme: dark) {
  .icon-btn:hover {
    background: #5c1a1a;
    border-color: #991b1b;
    color: #ff6b6b;
  }
}

.info-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-heading);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.structure-section {
  margin-bottom: 16px;
}

.structure-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 8px;
}

.structure-content {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.structure-content pre {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--color-text);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.reload-btn {
  width: 100%;
  padding: 8px 16px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  transition: all 0.2s;
}

.reload-btn:hover {
  background: var(--color-brand-dark);
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-chat .empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-chat h2 {
  font-size: 24px;
  color: var(--color-heading);
  margin-bottom: 8px;
}

.empty-chat p {
  color: var(--color-text-light);
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  min-height: 0;
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

.empty-state .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h2 {
  font-size: 20px;
  margin-bottom: 6px;
  color: var(--color-heading);
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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
  font-size: 15px;
}

.message.user .message-text {
  background: var(--color-background-mute);
  padding: 10px 14px;
  border-radius: 12px;
  display: inline-block;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
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
  30% { opacity: 1; transform: translateY(-8px); }
}

.input-container {
  padding: 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
  flex-shrink: 0;
}

.input-form {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  max-height: 150px;
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
  padding: 10px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 10px;
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