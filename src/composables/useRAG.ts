import { ref, computed } from 'vue'
import { RAGServiceClient } from '@/services/rag.service'
import type { ChatMessage, UploadedFile, SearchResult } from '@/types/rag'

export function useRAG() {
  const ragService = new RAGServiceClient()
  
  const messages = ref<ChatMessage[]>([])
  const uploadedFiles = ref<UploadedFile[]>([])
  const isUploading = ref(false)
  const isQuerying = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)

  const hasDocuments = computed(() => uploadedFiles.value.length > 0)
  const totalChunks = computed(() => 
    uploadedFiles.value.reduce((sum, file) => sum + file.chunks, 0)
  )

  const uploadDocument = async (file: File) => {
    if (!file) return

    isUploading.value = true
    error.value = null
    uploadProgress.value = 0

    try {
      // Симулируем прогресс (в реальности можно использовать XMLHttpRequest для отслеживания)
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += 10
        }
      }, 200)

      const result = await ragService.uploadDocument(file)
      
      clearInterval(progressInterval)
      uploadProgress.value = 100

      // Обновляем список файлов
      await loadDocuments()

      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed'
      throw e
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  const askQuestion = async (question: string) => {
    if (!question.trim()) return

    error.value = null
    isQuerying.value = true

    // Добавляем вопрос пользователя
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    messages.value.push(userMessage)

    // Создаем пустое сообщение для ответа
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      sources: [],
      timestamp: new Date()
    }
    messages.value.push(assistantMessage)

    try {
      const stream = ragService.streamQuery(question)

      for await (const chunk of stream) {
        if (chunk.type === 'sources') {
          assistantMessage.sources = chunk.data as SearchResult[]
        } else if (chunk.type === 'answer') {
          assistantMessage.content += chunk.data as string
        } else if (chunk.type === 'done') {
          break
        }
      }

      return assistantMessage
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Query failed'
      // Удаляем незавершенное сообщение
      messages.value.pop()
      throw e
    } finally {
      isQuerying.value = false
    }
  }

  const loadDocuments = async () => {
    try {
      const result = await ragService.getDocuments()
      uploadedFiles.value = result.files
    } catch (e) {
      console.error('Failed to load documents:', e)
    }
  }

  const clearAllDocuments = async () => {
    try {
      await ragService.clearDocuments()
      uploadedFiles.value = []
      messages.value = []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to clear documents'
      throw e
    }
  }

  const clearMessages = () => {
    messages.value = []
  }

  return {
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
  }
}