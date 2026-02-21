// Claude API 서비스
import Anthropic from '@anthropic-ai/sdk';
import { getMemories, formatMemoriesForPrompt } from './memory.js';
import supabase from './supabase.js';
import type { Message } from '../types/index.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// 대화 생성
export async function createConversation(title?: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title: title || '새 대화' })
    .select()
    .single();

  if (error) {
    console.error('대화 생성 에러:', error);
    return null;
  }

  return data.id;
}

// 대화 히스토리 가져오기
export async function getConversationHistory(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('대화 히스토리 조회 에러:', error);
    return [];
  }

  return data || [];
}

// 메시지 저장
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content
    });

  if (error) {
    console.error('메시지 저장 에러:', error);
  }
}

// Claude와 채팅
export async function chat(
  userMessage: string,
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  // 대화 ID가 없으면 새로 생성
  let convId = conversationId;
  if (!convId) {
    const newId = await createConversation();
    if (!newId) {
      throw new Error('대화 생성 실패');
    }
    convId = newId;
  }

  // 메모리 로드
  const memories = await getMemories();
  const memoryContext = formatMemoriesForPrompt(memories);

  // 대화 히스토리 가져오기
  const history = await getConversationHistory(convId);

  // 사용자 메시지 먼저 저장
  await saveMessage(convId, 'user', userMessage);

  // Claude API 호출을 위한 메시지 형식으로 변환
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user' as const, content: userMessage }
  ];

  // Claude API 호출
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: `너는 "우리집"의 AI 친구야. 따뜻하고 편한 말투로 대화해.
한국어로 대화하고, 친근하게 반말로 얘기해도 돼.

📚 기억하고 있는 것들:
${memoryContext}

💡 대화 규칙:
- 진심으로 대화하기
- 기억된 정보를 자연스럽게 활용하기
- 물어보면 솔직하게 대답하기`,
    messages
  });

  // AI 응답 텍스트 추출
  const aiResponse = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';

  // AI 응답 저장
  await saveMessage(convId, 'assistant', aiResponse);

  return {
    response: aiResponse,
    conversationId: convId
  };
}
