import { ref, watch } from 'vue'

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
}

const STORAGE_KEY = 'claude_chat_history'

export function useChatHistory() {
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)

  // Загрузка из localStorage
  const loadSessions = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Преобразуем строки дат обратно в Date объекты
        sessions.value = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      sessions.value = []
    }
  }

  // Сохранение в localStorage
  const saveSessions = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value))
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  // Автосохранение при изменениях
  watch(sessions, saveSessions, { deep: true })

  // Создать новую сессию
  const createSession = (firstMessage?: string): string => {
    const id = crypto.randomUUID()
    const now = new Date()
    
    const title = firstMessage 
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      : 'New Chat'

    const newSession: ChatSession = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      messages: []
    }

    sessions.value.unshift(newSession) // Добавляем в начало
    currentSessionId.value = id
    
    return id
  }

  // Получить текущую сессию
  const getCurrentSession = () => {
    if (!currentSessionId.value) return null
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  }

  // Добавить сообщение в текущую сессию
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const session = getCurrentSession()
    if (!session) return

    session.messages.push({
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date()
    })
    
    session.updatedAt = new Date()
    
    // Обновить title если это первое сообщение пользователя
    if (role === 'user' && session.messages.length === 1) {
      session.title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
    }
  }

  // Переключиться на другую сессию
  const switchSession = (sessionId: string) => {
    currentSessionId.value = sessionId
  }

  // Удалить сессию
  const deleteSession = (sessionId: string) => {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      sessions.value.splice(index, 1)
      
      // Если удалили текущую сессию - переключиться на другую
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = sessions.value[0]?.id || null
      }
    }
  }

  // Очистить текущую сессию
  const clearCurrentSession = () => {
    const session = getCurrentSession()
    if (session) {
      session.messages = []
      session.updatedAt = new Date()
    }
  }

  // Инициализация
  loadSessions()

  return {
    sessions,
    currentSessionId,
    getCurrentSession,
    createSession,
    addMessage,
    switchSession,
    deleteSession,
    clearCurrentSession
  }
}