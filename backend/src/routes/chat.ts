// 채팅 API 라우트
import { Router } from 'express';
import { chat } from '../services/claude.js';
import { getMemories, addMemory, deleteMemory } from '../services/memory.js';
import type { ChatRequest, MemoryRequest } from '../types/index.js';

const router = Router();

// POST /api/chat - 채팅 메시지 전송
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지가 필요해요' });
    }

    const result = await chat(message, conversationId);
    const memories = await getMemories();

    return res.json({
      response: result.response,
      conversationId: result.conversationId,
      memories
    });
  } catch (error) {
    console.error('채팅 에러:', error);
    return res.status(500).json({ error: '채팅 처리 중 에러가 발생했어요' });
  }
});

// GET /api/memories - 모든 메모리 조회
router.get('/memories', async (_req, res) => {
  try {
    const memories = await getMemories();
    return res.json(memories);
  } catch (error) {
    console.error('메모리 조회 에러:', error);
    return res.status(500).json({ error: '메모리 조회 중 에러가 발생했어요' });
  }
});

// POST /api/memories - 메모리 추가
router.post('/memories', async (req, res) => {
  try {
    const { category, content } = req.body as MemoryRequest;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: '내용이 필요해요' });
    }

    const memory = await addMemory(category || 'fact', content);
    
    if (!memory) {
      return res.status(500).json({ error: '메모리 저장 실패' });
    }

    return res.json(memory);
  } catch (error) {
    console.error('메모리 추가 에러:', error);
    return res.status(500).json({ error: '메모리 추가 중 에러가 발생했어요' });
  }
});

// DELETE /api/memories/:id - 메모리 삭제
router.delete('/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const success = await deleteMemory(id);
    
    if (!success) {
      return res.status(500).json({ error: '메모리 삭제 실패' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('메모리 삭제 에러:', error);
    return res.status(500).json({ error: '메모리 삭제 중 에러가 발생했어요' });
  }
});

export default router;
