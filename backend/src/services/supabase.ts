// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

// ✅ 디버깅 추가
console.log('🔍 Supabase 설정:');
console.log('URL:', supabaseUrl ? '✅ 있음' : '❌ 없음');
console.log('KEY:', supabaseKey ? '✅ 있음' : '❌ 없음');

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ 연결 테스트 추가
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase 연결 실패:', error);
      return false;
    }
    console.log('✅ Supabase 연결 성공!');
    return true;
  } catch (err) {
    console.error('❌ Supabase 에러:', err);
    return false;
  }
}

// 즉시 테스트
testConnection();

export default supabase;
