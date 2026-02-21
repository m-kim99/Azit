// 타입 정의

export interface Conversation {
  id: string;
  created_at: string;
  title: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Memory {
  id: string;
  category: 'critical' | 'preference' | 'fact' | string;
  content: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  memories?: Memory[];
}

export interface MemoryRequest {
  category: string;
  content: string;
}
