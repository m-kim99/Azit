# 우리집 (Our Home) - AI Chat Application

Supabase를 활용한 간단한 AI 채팅 애플리케이션입니다.

## 🏗 프로젝트 구조

```
/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ChatUI.tsx
│   │   │   ├── Message.tsx
│   │   │   └── MemoryPanel.tsx
│   │   ├── api/
│   │   │   └── chat.ts
│   │   └── types/
│   │       └── index.ts
│   └── ...
│
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── chat.ts
│   │   ├── services/
│   │   │   ├── claude.ts
│   │   │   ├── supabase.ts
│   │   │   └── memory.ts
│   │   └── types/
│   │       └── index.ts
│   └── ...
│
└── README.md
```

## 🚀 시작하기

### 1. Supabase 설정

Supabase 프로젝트에서 다음 SQL을 실행하세요:

```sql
-- conversations 테이블
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  title TEXT
);

-- messages 테이블  
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- memories 테이블
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 초기 메모리 (선택)
INSERT INTO memories (category, content) VALUES
  ('critical', '사용자의 중요한 정보'),
  ('preference', '사용자의 선호도'),
  ('fact', '사용자에 대한 사실');
```

### 2. 환경 변수 설정

**Backend (`backend/.env`):**
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```bash
VITE_API_URL=http://localhost:3001
```

### 3. 패키지 설치

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. 실행

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend (새 터미널에서):**
```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속!

## 📚 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/chat` | 채팅 메시지 전송 |
| GET | `/api/memories` | 모든 메모리 조회 |
| POST | `/api/memories` | 메모리 추가 |
| DELETE | `/api/memories/:id` | 메모리 삭제 |

### 채팅 요청 예시

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "안녕!"}'
```

## 🛠 기술 스택

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude API

## 💡 주요 기능

1. **실시간 채팅**: Claude API를 통한 AI 대화
2. **메모리 시스템**: 대화 내용과 사용자 정보 기억
3. **대화 히스토리**: Supabase에 대화 저장
4. **메모리 관리**: UI에서 메모리 추가/삭제

---

Made with 💜
