// Vercel Serverless Function - 메모리 API
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - 모든 메모리 조회
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('메모리 조회 에러:', error);
        return res.status(500).json({ error: '메모리 조회 실패' });
      }

      return res.status(200).json(data || []);
    }

    // POST - 메모리 추가
    if (req.method === 'POST') {
      const { category, content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: '내용이 필요해요' });
      }

      const { data, error } = await supabase
        .from('memories')
        .insert({ category: category || 'fact', content })
        .select()
        .single();

      if (error) {
        console.error('메모리 추가 에러:', error);
        return res.status(500).json({ error: '메모리 추가 실패' });
      }

      return res.status(200).json(data);
    }

    // DELETE - 메모리 삭제
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID가 필요해요' });
      }

      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('메모리 삭제 에러:', error);
        return res.status(500).json({ error: '메모리 삭제 실패' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('메모리 API 에러:', error);
    return res.status(500).json({ error: '서버 에러' });
  }
}
