// 채팅 인터페이스 컴포넌트
import { useState, useRef, useEffect } from 'react';
import type { Message as MessageType, Memory } from '../types';
import { sendMessage, getMemories } from '../api/chat';
import Message from './Message';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';

interface Session {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatUI() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionTitle, setCurrentSessionTitle] = useState('새 대화');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // 새 채팅 시작
  const handleNewChat = () => {
    // 현재 대화가 있으면 세션 목록에 추가
    if (conversationId && messages.length > 0) {
      const newSession: Session = {
        id: conversationId,
        title: currentSessionTitle,
        created_at: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
    }
    
    setMessages([]);
    setConversationId(undefined);
    setCurrentSessionTitle('새 대화');
  };

  // 세션 선택 (현재는 UI만 - 실제 로드 기능은 추후 구현)
  const handleSelectSession = (id: string) => {
    console.log('세션 선택:', id);
    // TODO: 세션 데이터 로드 기능 구현
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // 첫 메시지면 세션 제목으로 설정
    if (messages.length === 0) {
      setCurrentSessionTitle(userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : ''));
    }

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
    <div className="flex h-screen bg-white">
      {/* 사이드바 */}
      <Sidebar
        sessions={sessions}
        currentSessionId={conversationId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 헤더 - 현재 세션 이름 */}
        <header className="h-14 border-b border-gray-200 flex items-center px-6">
          <h2 className="text-sm font-medium text-gray-700">{currentSessionTitle}</h2>
        </header>

        {/* 메시지 영역 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-6 px-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <span className="text-6xl mb-4">🏠</span>
                <p className="text-lg font-medium text-gray-600">OurHome_Azit</p>
                <p className="text-sm text-gray-400 mt-2">대화를 시작해보세요!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-[#f9f5f1] text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#c9a87c] rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-[#c9a87c] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-2 h-2 bg-[#c9a87c] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </main>

        {/* 입력 영역 */}
        <footer className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="답글..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-[#c9a87c] focus:border-[#c9a87c]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#c9a87c] hover:text-[#b89a6c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '⏳' : '➤'}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              OurHome_Azit은 실수할 수 있습니다. 중요한 정보는 확인하세요.
            </p>
          </form>
        </footer>
      </div>

      {/* 설정 모달 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        memories={memories}
        onMemoriesChange={loadMemories}
      />
    </div>
  );
}
