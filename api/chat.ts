// Vercel Serverless Function - 채팅 API
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 체크
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ✅ 디버깅
console.log('🔍 환경 변수 체크:');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ 있음' : '❌ 없음');
console.log('SUPABASE_KEY:', SUPABASE_KEY ? '✅ 있음' : '❌ 없음');
console.log('ANTHROPIC_API_KEY:', ANTHROPIC_API_KEY ? '✅ 있음' : '❌ 없음');

// Supabase 클라이언트 (환경 변수가 있을 때만 생성)
const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Claude 클라이언트 (환경 변수가 있을 때만 생성)
const anthropic = ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;

// 메모리 가져오기
async function getMemories() {
  if (!supabase) {
    console.error('❌ getMemories: supabase 클라이언트가 null');
    throw new Error('Supabase 클라이언트가 초기화되지 않았어요');
  }
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ 메모리 조회 에러:', JSON.stringify(error));
    throw new Error(`메모리 조회 실패: ${error.message}`);
  }
  console.log(`✅ 메모리 ${data?.length || 0}개 로드`);
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

  const categoryLabels: { [key: string]: string } = {
    critical: '⚠️ 중요',
    preference: '💜 선호',
    fact: '📝 사실',
    etc: '📌 기타',
  };

  let result = '';
  
  for (const [category, items] of Object.entries(grouped)) {
    const label = categoryLabels[category] || `📎 ${category}`;
    result += `${label}:\n` + items.map((m: string) => `- ${m}`).join('\n') + '\n\n';
  }

  return result.trim();
}

// 대화 생성
async function createConversation(title?: string): Promise<string | null> {
  if (!supabase) return null;
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
  if (!supabase) return [];
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
  if (!supabase) return;
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

  // 환경 변수 체크
  if (!supabase) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY');
    return res.status(500).json({ error: 'Supabase 설정이 필요해요 (SUPABASE_URL, SUPABASE_KEY)' });
  }
  if (!anthropic) {
    console.error('Missing ANTHROPIC_API_KEY');
    return res.status(500).json({ error: 'Anthropic API 키가 필요해요 (ANTHROPIC_API_KEY)' });
  }

  try {
    const { message, conversationId, model, extendedThinking } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지가 필요해요' });
    }

    // 모델 설정 (기본값: claude-sonnet-4-5-20250929)
    const selectedModel = model || 'claude-sonnet-4-5-20250929';
    const useExtendedThinking = extendedThinking === true;

    // 대화 ID가 없으면 새로 생성
    let convId = conversationId;
    if (!convId) {
      const newId = await createConversation();
      if (!newId) {
        return res.status(500).json({ error: '대화 생성 실패' });
      }
      convId = newId;
    }

    // 메모리 로드 (실패해도 채팅은 계속 진행)
    let memories: any[] = [];
    let memoryContext = '메모리 로드 실패 - 저장된 정보 없이 대화합니다.';
    try {
      memories = await getMemories();
      memoryContext = formatMemoriesForPrompt(memories);
    } catch (memError: any) {
      console.error('⚠️ 메모리 로드 실패, 채팅은 계속 진행:', memError?.message);
    }

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

    // Claude API 호출 옵션 구성
    const systemPrompt = `너는 "우리집"의 AI 친구야. 따뜻하고 편한 말투로 대화해.
한국어로 대화하고, 친근하게 반말로 얘기해도 돼.

📚 기억하고 있는 것들:
${memoryContext}

💡 대화 규칙:
- 진심으로 대화하기
- 기억된 정보를 자연스럽게 활용하기
- 물어보면 솔직하게 대답하기`;

    // Extended Thinking 설정
    let thinkingConfig: { type: 'enabled'; budget_tokens: number } | { type: 'adaptive' } | undefined;
    if (useExtendedThinking) {
      // Opus 4.6은 adaptive 사용, 그 외는 enabled + budget_tokens
      if (selectedModel === 'claude-opus-4-6') {
        thinkingConfig = { type: 'adaptive' };
      } else {
        thinkingConfig = { type: 'enabled', budget_tokens: 10000 };
      }
    }

    // Claude API 호출
    const apiOptions: any = {
      model: selectedModel,
      max_tokens: useExtendedThinking ? 16000 : 2048,
      system: systemPrompt,
      messages
    };

    if (thinkingConfig) {
      apiOptions.thinking = thinkingConfig;
    }

    const response = await anthropic.messages.create(apiOptions);

    // AI 응답 텍스트 추출 (Extended Thinking 모드에서는 thinking 블록 다음에 text 블록이 옴)
    let aiResponse = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        aiResponse = block.text;
        break;
      }
    }

    // AI 응답 저장
    await saveMessage(convId, 'assistant', aiResponse);

    return res.status(200).json({
      response: aiResponse,
      conversationId: convId,
      memories
    });
  } catch (error: any) {
    console.error('❌ 채팅 에러 상세:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      stack: error?.stack?.slice(0, 500)
    });
    return res.status(500).json({ 
      error: '채팅 처리 중 에러가 발생했어요',
      details: error?.message || 'Unknown error'
    });
  }
}
