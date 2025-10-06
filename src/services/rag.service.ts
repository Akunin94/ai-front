const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export class RAGServiceClient {
  async uploadDocument(file: File): Promise<{
    success: boolean
    filename: string
    chunks: number
    totalDocuments: number
  }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/rag/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  }

  async query(question: string): Promise<{
    answer: string
    sources: any[]
    tokensUsed: { input: number; output: number }
  }> {
    const response = await fetch(`${API_BASE_URL}/api/rag/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Query failed')
    }

    return response.json()
  }

  async *streamQuery(question: string): AsyncGenerator<{
    type: 'answer' | 'sources' | 'done'
    data: string | any[]
  }> {
    const response = await fetch(`${API_BASE_URL}/api/rag/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Stream query failed')
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
            yield event
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }
    }
  }

  async getDocuments(): Promise<{
    files: Array<{
      filename: string
      chunks: number
      uploadedAt: string
    }>
    totalChunks: number
  }> {
    const response = await fetch(`${API_BASE_URL}/api/rag/documents`)

    if (!response.ok) {
      throw new Error('Failed to get documents')
    }

    return response.json()
  }

  async clearDocuments(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/rag/documents`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to clear documents')
    }
  }
}