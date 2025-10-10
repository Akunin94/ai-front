import { ref, computed } from 'vue'
import { ClaudeService } from '@/services/claude.service'
import type { Message } from '@/types/claude'

export function useClaude() {
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const claudeService = new ClaudeService()

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    messages.value.push({
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date()
    })
  }

  const sendMessage = async (
    content: string,
    options?: {
      systemPrompt?: string
      temperature?: number
    }
  ) => {
    if (!content.trim()) return

    error.value = null
    isLoading.value = true

    addMessage('user', content)

    try {
      const response = await claudeService.sendMessage(
        messages.value,
        options
      )

      const assistantMessage = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')

      addMessage('assistant', assistantMessage)

      return assistantMessage
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error sending message:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const streamMessage = async (
    content: string,
    options?: {
      systemPrompt?: string
      temperature?: number
      onChunk?: (text: string) => void
    }
  ) => {
    if (!content.trim()) return

    error.value = null
    isLoading.value = true

    addMessage('user', content)

    const assistantMessageId = crypto.randomUUID()
    messages.value.push({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    })

    try {
      const stream = claudeService.streamMessage(messages.value.slice(0, -1), options)
      
      for await (const chunk of stream) {
        const lastMessage = messages.value[messages.value.length - 1]
        if (lastMessage) {
          lastMessage.content += chunk
        }
        
        options?.onChunk?.(chunk)
      }

      return messages.value[messages.value.length - 1]?.content || ''
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      messages.value.pop()
      console.error('Error streaming message:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const clearMessages = () => {
    messages.value = []
  }

  const lastMessage = computed(() => 
    messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  )

  const conversationLength = computed(() => 
    messages.value.length
  )

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    streamMessage,
    clearMessages,
    lastMessage,
    conversationLength
  }
}