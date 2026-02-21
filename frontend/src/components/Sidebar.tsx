// 사이드바 컴포넌트
import { useState } from 'react';

interface Session {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  sessions: Session[];
  currentSessionId?: string;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onOpenSettings,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[#f9f5f1] h-screen flex flex-col border-r border-[#e8e0d8]">
      {/* 상단 로고 */}
      <div className="p-4 border-b border-[#e8e0d8]">
        <h1 className="text-lg font-semibold text-[#8b7355]">OurHome_Azit</h1>
      </div>

      {/* 새 채팅 버튼 */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5a4a3a] hover:bg-[#efe8e0] rounded-lg transition-colors"
        >
          <span className="text-lg">+</span>
          <span>새 채팅</span>
        </button>
      </div>

      {/* 검색 */}
      <div className="px-3 pb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89a8a]">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#e8e0d8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a87c] placeholder-[#a89a8a]"
          />
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="text-xs text-[#a89a8a] px-2 py-2">채팅</div>
        {filteredSessions.length === 0 ? (
          <p className="text-sm text-[#a89a8a] px-2 py-4 text-center">
            {searchQuery ? '검색 결과 없음' : '대화 없음'}
          </p>
        ) : (
          <div className="space-y-1">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${
                  session.id === currentSessionId
                    ? 'bg-[#efe8e0] text-[#5a4a3a]'
                    : 'text-[#7a6a5a] hover:bg-[#efe8e0]'
                }`}
              >
                {session.title || '새 대화'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 하단 사용자 영역 */}
      <div className="p-3 border-t border-[#e8e0d8]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#c9a87c] rounded-full flex items-center justify-center text-white text-sm font-medium">
              M
            </div>
            <span className="text-sm text-[#5a4a3a]">Mini</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-2 text-[#7a6a5a] hover:bg-[#efe8e0] rounded-lg transition-colors"
            title="설정"
          >
            ⚙️
          </button>
        </div>
      </div>
    </aside>
  );
}
