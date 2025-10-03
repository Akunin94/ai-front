import type { Message, ClaudeResponse } from '@/types/claude'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export class ClaudeService {
  async sendMessage(
    messages: Message[],
    options?: {
      model?: string
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
    }
  ): Promise<ClaudeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        system: options?.systemPrompt,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${error.error || response.statusText}`)
    }

    return response.json()
  }

  async *streamMessage(
    messages: Message[],
    options?: {
      model?: string
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
    }
  ): AsyncGenerator<string> {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        system: options?.systemPrompt,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${error.error || response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            
            if (event.type === 'text' && event.text) {
              yield event.text
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }
    }
  }
}