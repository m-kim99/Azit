// Vercel Serverless Function - 대화 목록 API
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase 설정이 필요해요' });
  }

  if (req.method === 'GET') {
    try {
      // 최근 대화 목록 가져오기 (최근 50개)
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('대화 목록 조회 에러:', error);
        return res.status(500).json({ error: '대화 목록 조회 실패' });
      }

      return res.status(200).json(data || []);
    } catch (error: any) {
      console.error('대화 목록 에러:', error);
      return res.status(500).json({ error: error?.message || '에러 발생' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
