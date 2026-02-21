// 채팅 인터페이스 컴포넌트
import { useState, useRef, useEffect } from 'react';
import type { Message as MessageType, Memory } from '../types';
import { sendMessage, getMemories } from '../api/chat';
import Message from './Message';
import MemoryPanel from './MemoryPanel';

export default function ChatUI() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메모리 로드
  const loadMemories = async () => {
    try {
      const data = await getMemories();
      setMemories(data);
    } catch (error) {
      console.error('메모리 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // 사용자 메시지 추가 (임시 ID)
    const tempUserMsg: MessageType = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage, conversationId);
      
      // 대화 ID 저장
      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      // AI 응답 추가
      const aiMsg: MessageType = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 메모리 업데이트
      if (response.memories) {
        setMemories(response.memories);
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      // 에러 메시지 표시
      const errorMsg: MessageType = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '미안, 에러가 발생했어. 다시 시도해볼래?',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl">
          🏠
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">우리집</h1>
          <p className="text-xs text-gray-400">AI Chat</p>
        </div>
      </header>

      {/* 메시지 영역 */}
      <main className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-6xl mb-4">💬</span>
            <p className="text-lg">대화를 시작해보세요!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* 입력 영역 */}
      <footer className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 border border-gray-200 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : '전송'}
          </button>
        </form>
      </footer>

      {/* 메모리 패널 */}
      <MemoryPanel memories={memories} onMemoriesChange={loadMemories} />
    </div>
  );
}
