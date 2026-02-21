// 디버그 엔드포인트 - 단계별 테스트
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: any = {
    step1_basic: '✅ Function works',
    step2_env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.slice(0, 30)}...` : '❌ MISSING',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? `${process.env.SUPABASE_KEY.slice(0, 15)}...` : '❌ MISSING',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.slice(0, 15)}...` : '❌ MISSING',
    },
    step3_supabase: 'testing...',
  };

  // Step 3: Supabase import test
  try {
    const { createClient } = await import('@supabase/supabase-js');
    results.step3_supabase = '✅ Import OK';
    
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    
    if (!url || !key) {
      results.step4_connection = '❌ Missing env vars';
      return res.status(200).json(results);
    }

    const supabase = createClient(url, key);
    results.step4_connection = '✅ Client created';

    // Step 5: Read test
    const { data: memData, error: memErr } = await supabase.from('memories').select('*').limit(3);
    results.step5_read_memories = memErr 
      ? { status: '❌', error: memErr.message, code: memErr.code, hint: memErr.hint }
      : { status: '✅', count: memData?.length, data: memData };

    // Step 6: Read conversations
    const { data: convData, error: convErr } = await supabase.from('conversations').select('*').limit(3);
    results.step6_read_conversations = convErr
      ? { status: '❌', error: convErr.message, code: convErr.code, hint: convErr.hint }
      : { status: '✅', count: convData?.length, data: convData };

    // Step 7: Insert test
    const { data: insertData, error: insertErr } = await supabase
      .from('conversations')
      .insert({ title: 'DEBUG_TEST' })
      .select('id, title, created_at')
      .single();
    results.step7_insert_conversation = insertErr
      ? { status: '❌', error: insertErr.message, code: insertErr.code, hint: insertErr.hint, details: insertErr.details }
      : { status: '✅', data: insertData };

    // Cleanup
    if (insertData?.id) {
      await supabase.from('conversations').delete().eq('id', insertData.id);
      results.step8_cleanup = '✅';
    }

  } catch (e: any) {
    results.step3_supabase = { status: '❌ CRASH', message: e.message, stack: e.stack?.slice(0, 300) };
  }

  return res.status(200).json(results);
}
