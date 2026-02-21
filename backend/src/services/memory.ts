// 메모리 관리 서비스
import supabase from './supabase.js';
import type { Memory } from '../types/index.js';

// 모든 메모리 가져오기
export async function getMemories(): Promise<Memory[]> {
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

// 메모리 추가
export async function addMemory(category: string, content: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .insert({ category, content })
    .select()
    .single();

  if (error) {
    console.error('메모리 추가 에러:', error);
    return null;
  }

  return data;
}

// 메모리 삭제
export async function deleteMemory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('메모리 삭제 에러:', error);
    return false;
  }

  return true;
}

// 메모리를 시스템 프롬프트용 텍스트로 변환
export function formatMemoriesForPrompt(memories: Memory[]): string {
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
    result += '⚠️ 중요:\n' + grouped['critical'].map(m => `- ${m}`).join('\n') + '\n\n';
  }
  if (grouped['preference']) {
    result += '💜 선호:\n' + grouped['preference'].map(m => `- ${m}`).join('\n') + '\n\n';
  }
  if (grouped['fact']) {
    result += '📝 사실:\n' + grouped['fact'].map(m => `- ${m}`).join('\n') + '\n\n';
  }
  if (grouped['etc']) {
    result += '기타:\n' + grouped['etc'].map(m => `- ${m}`).join('\n') + '\n';
  }

  return result.trim();
}
