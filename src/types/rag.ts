export interface UploadedFile {
    filename: string
    chunks: number
    uploadedAt: string
  }
  
  export interface SearchResult {
    content: string
    metadata: {
      source: string
      filename: string
      page?: number
      uploadedAt: string
    }
    score: number
  }
  
  export interface RAGResponse {
    answer: string
    sources: SearchResult[]
    tokensUsed: {
      input: number
      output: number
    }
  }
  
  export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: SearchResult[]
    timestamp: Date
  }