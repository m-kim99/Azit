// 프론트엔드 타입 정의

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Memory {
  id: string;
  category: string;
  content: string;
  created_at: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  memories?: Memory[];
}
