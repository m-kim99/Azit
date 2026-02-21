// 디버그 엔드포인트 - Supabase 연결 테스트
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  const results: any = {
    env: {
      SUPABASE_URL: SUPABASE_URL ? `${SUPABASE_URL.slice(0, 30)}...` : '❌ MISSING',
      SUPABASE_KEY: SUPABASE_KEY ? `${SUPABASE_KEY.slice(0, 10)}...` : '❌ MISSING',
      ANTHROPIC_API_KEY: ANTHROPIC_API_KEY ? `${ANTHROPIC_API_KEY.slice(0, 10)}...` : '❌ MISSING',
    },
    tests: {}
  };

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    results.tests.connection = '❌ Cannot test - missing env vars';
    return res.status(200).json(results);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test 1: Read memories
  try {
    const { data, error } = await supabase.from('memories').select('*').limit(3);
    results.tests.read_memories = error 
      ? { status: '❌', error: error.message, code: error.code, hint: error.hint }
      : { status: '✅', count: data?.length, sample: data };
  } catch (e: any) {
    results.tests.read_memories = { status: '❌ EXCEPTION', message: e.message };
  }

  // Test 2: Read conversations
  try {
    const { data, error } = await supabase.from('conversations').select('*').limit(3);
    results.tests.read_conversations = error
      ? { status: '❌', error: error.message, code: error.code, hint: error.hint }
      : { status: '✅', count: data?.length, sample: data };
  } catch (e: any) {
    results.tests.read_conversations = { status: '❌ EXCEPTION', message: e.message };
  }

  // Test 3: Insert conversation
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title: 'DEBUG_TEST' })
      .select('id, title, created_at')
      .single();
    results.tests.insert_conversation = error
      ? { status: '❌', error: error.message, code: error.code, hint: error.hint, details: error.details }
      : { status: '✅', data };

    // Cleanup: delete test conversation
    if (data?.id) {
      await supabase.from('conversations').delete().eq('id', data.id);
      results.tests.delete_cleanup = '✅ cleaned up';
    }
  } catch (e: any) {
    results.tests.insert_conversation = { status: '❌ EXCEPTION', message: e.message };
  }

  // Test 4: Read messages
  try {
    const { data, error } = await supabase.from('messages').select('*').limit(1);
    results.tests.read_messages = error
      ? { status: '❌', error: error.message, code: error.code, hint: error.hint }
      : { status: '✅', count: data?.length };
  } catch (e: any) {
    results.tests.read_messages = { status: '❌ EXCEPTION', message: e.message };
  }

  return res.status(200).json(results);
}
