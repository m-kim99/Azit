// API 호출 함수들
import type { ChatResponse, Memory } from '../types';

// Vercel 배포시 상대 경로 사용, 로컬 개발시 localhost:3001
const API_URL = import.meta.env.VITE_API_URL || '';

// 채팅 메시지 전송
export async function sendMessage(
  message: string,
  conversationId?: string,
  model?: string,
  extendedThinking?: boolean
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, conversationId, model, extendedThinking }),
  });

  if (!response.ok) {
    throw new Error('채팅 요청 실패');
  }

  return response.json();
}

// 모든 메모리 가져오기
export async function getMemories(): Promise<Memory[]> {
  const response = await fetch(`${API_URL}/api/memories`);

  if (!response.ok) {
    throw new Error('메모리 조회 실패');
  }

  return response.json();
}

// 메모리 추가
export async function addMemory(
  category: string,
  content: string
): Promise<Memory> {
  const response = await fetch(`${API_URL}/api/memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category, content }),
  });

  if (!response.ok) {
    throw new Error('메모리 추가 실패');
  }

  return response.json();
}

// 메모리 삭제
export async function deleteMemory(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/memories?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('메모리 삭제 실패');
  }
}

// 대화 목록 가져오기
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/api/conversations`);

  if (!response.ok) {
    throw new Error('대화 목록 조회 실패');
  }

  return response.json();
}
