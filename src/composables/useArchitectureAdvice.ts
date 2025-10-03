import { ref } from 'vue'
import { ClaudeService } from '@/services/claude.service'
import { THINKING_SYSTEM_PROMPT, createArchitecturePrompt } from '@/services/prompts/thinking.prompt'

export function useArchitectureAdvice() {
  const claudeService = new ClaudeService()
  const isThinking = ref(false)
  const advice = ref('')
  const error = ref<string | null>(null)

  const getAdvice = async (description: string) => {
    if (!description.trim()) {
      error.value = 'Description cannot be empty'
      return
    }

    isThinking.value = true
    error.value = null
    advice.value = ''

    try {
      const prompt = createArchitecturePrompt(description)
      
      // Используем streaming для живого ответа
      const stream = claudeService.streamMessage(
        [{
          id: crypto.randomUUID(),
          role: 'user',
          content: prompt,
          timestamp: new Date()
        }],
        {
          systemPrompt: THINKING_SYSTEM_PROMPT,
          temperature: 0.7,
          maxTokens: 8000
        }
      )

      for await (const chunk of stream) {
        advice.value += chunk
      }

    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to get advice'
      console.error('Architecture advice error:', e)
    } finally {
      isThinking.value = false
    }
  }

  return {
    isThinking,
    advice,
    error,
    getAdvice
  }
}