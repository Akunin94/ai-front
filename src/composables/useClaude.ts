import { ref } from 'vue'
import { ClaudeService } from '@/services/claude.service'
import type { Message } from '@/types/claude'

export function useClaude() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const claudeService = new ClaudeService()

  const sendMessage = async (
    messages: Message[], // ← Принимаем messages как параметр
    options?: {
      systemPrompt?: string
      temperature?: number
    }
  ) => {
    error.value = null
    isLoading.value = true

    try {
      const response = await claudeService.sendMessage(
        messages,
        options
      )

      const assistantMessage = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')

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
    messages: Message[], // ← Принимаем messages как параметр
    options?: {
      systemPrompt?: string
      temperature?: number
      onChunk?: (text: string) => void
    }
  ) => {
    error.value = null
    isLoading.value = true

    try {
      const stream = claudeService.streamMessage(messages, options)
      let fullResponse = ''
      
      for await (const chunk of stream) {
        fullResponse += chunk
        options?.onChunk?.(chunk)
      }

      return fullResponse
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error streaming message:', e)
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    sendMessage,
    streamMessage
  }
}