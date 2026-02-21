// Vercel Serverless Function - 채팅 API
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Claude 클라이언트
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// 메모리 가져오기
async function getMemories() {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('메모리 조회 에러:', error);
    return [];
  }
  return data || [];
}

// 메모리를 시스템 프롬프트용 텍스트로 변환
function formatMemoriesForPrompt(memories: any[]): string {
  if (memories.length === 0) return '아직 저장된 정보가 없어요.';

  const grouped: { [key: string]: string[] } = {};
  
  for (const memory of memories) {
    const category = memory.category || 'etc';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(memory.content);
  }

  let result = '';
  
  if (grouped['critical']) {
    result += '⚠️ 중요:\n' + grouped['critical'].map((m: string) => `- ${m}`).join('\n') + '\n\n';
  }
  if (grouped['preference']) {
    result += '💜 선호:\n' + grouped['preference'].map((m: string) => `- ${m}`).join('\n') + '\n\n';
  }
  if (grouped['fact']) {
    result += '📝 사실:\n' + grouped['fact'].map((m: string) => `- ${m}`).join('\n') + '\n\n';
  }

  return result.trim();
}

// 대화 생성
async function createConversation(title?: string): Promise<string | null> {
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
async function getConversationHistory(conversationId: string) {
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
async function saveMessage(conversationId: string, role: string, content: string) {
  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content });

  if (error) {
    console.error('메시지 저장 에러:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지가 필요해요' });
    }

    // 대화 ID가 없으면 새로 생성
    let convId = conversationId;
    if (!convId) {
      const newId = await createConversation();
      if (!newId) {
        return res.status(500).json({ error: '대화 생성 실패' });
      }
      convId = newId;
    }

    // 메모리 로드
    const memories = await getMemories();
    const memoryContext = formatMemoriesForPrompt(memories);

    // 대화 히스토리 가져오기
    const history = await getConversationHistory(convId);

    // 사용자 메시지 저장
    await saveMessage(convId, 'user', message);

    // Claude API 호출을 위한 메시지 형식으로 변환
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...history.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    // Claude API 호출
    const response = await anthropic.messages.create({
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

    return res.status(200).json({
      response: aiResponse,
      conversationId: convId,
      memories
    });
  } catch (error) {
    console.error('채팅 에러:', error);
    return res.status(500).json({ error: '채팅 처리 중 에러가 발생했어요' });
  }
}
