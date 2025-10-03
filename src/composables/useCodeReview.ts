import { ref } from 'vue'
import { ClaudeService } from '@/services/claude.service'
import { CODE_REVIEW_SYSTEM_PROMPT, createCodeReviewPrompt } from '@/services/prompts/codeReview.prompt'
import { XMLParser } from '@/utils/xmlParser'
import type { CodeReviewResult } from '@/types/codeReview'

export function useCodeReview() {
  const claudeService = new ClaudeService()
  const isAnalyzing = ref(false)
  const error = ref<string | null>(null)
  const result = ref<CodeReviewResult | null>(null)

  const analyzeCode = async (code: string, language: string = 'typescript') => {
    if (!code.trim()) {
      error.value = 'Code cannot be empty'
      return
    }

    isAnalyzing.value = true
    error.value = null
    result.value = null

    try {
      const prompt = createCodeReviewPrompt(code, language)
      
      const response = await claudeService.sendMessage(
        [{ 
          id: crypto.randomUUID(), 
          role: 'user', 
          content: prompt,
          timestamp: new Date()
        }],
        {
          systemPrompt: CODE_REVIEW_SYSTEM_PROMPT,
          temperature: 0.3, // Низкая температура для более точного анализа
          maxTokens: 4096
        }
      )

      // Извлекаем текст из ответа
      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')

      // Парсим XML
      result.value = XMLParser.parseCodeReview(responseText)

    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to analyze code'
      console.error('Code review error:', e)
    } finally {
      isAnalyzing.value = false
    }
  }

  return {
    isAnalyzing,
    error,
    result,
    analyzeCode
  }
}