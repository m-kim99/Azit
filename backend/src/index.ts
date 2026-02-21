// 우리집 백엔드 서버
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 라우트
app.use('/api', chatRoutes);

// 헬스 체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: '우리집 서버가 잘 돌아가고 있어요!' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🏠 우리집 서버가 포트 ${PORT}에서 시작됐어요!`);
});
