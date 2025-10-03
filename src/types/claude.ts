export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }
  
  export interface ClaudeRequest {
    model: string
    max_tokens: number
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
    }>
    system?: string
    temperature?: number
    stream?: boolean
  }
  
  export interface ClaudeResponse {
    id: string
    type: 'message'
    role: 'assistant'
    content: Array<{
      type: 'text'
      text: string
    }>
    model: string
    stop_reason: string
    usage: {
      input_tokens: number
      output_tokens: number
    }
  }
  
  export interface ClaudeStreamEvent {
    type: 'message_start' | 'content_block_delta' | 'message_delta' | 'message_stop'
    delta?: {
      type: 'text_delta'
      text: string
    }
    usage?: {
      input_tokens: number
      output_tokens: number
    }
  }