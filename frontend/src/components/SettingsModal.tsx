// 설정 모달 컴포넌트 (메모리 관리 포함)
import { useState } from 'react';
import type { Memory } from '../types';
import { addMemory, deleteMemory } from '../api/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onMemoriesChange: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  memories,
  onMemoriesChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'memory' | 'general'>('memory');
  const [newCategory, setNewCategory] = useState('fact');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newContent.trim()) return;

    setIsAdding(true);
    try {
      await addMemory(newCategory, newContent.trim());
      setNewContent('');
      onMemoriesChange();
    } catch (error) {
      console.error('메모리 추가 실패:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
      onMemoriesChange();
    } catch (error) {
      console.error('메모리 삭제 실패:', error);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'critical':
        return '⚠️';
      case 'preference':
        return '💜';
      case 'fact':
        return '📝';
      default:
        return '📌';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'critical':
        return '중요';
      case 'preference':
        return '선호';
      case 'fact':
        return '사실';
      default:
        return '기타';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">설정</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex h-[60vh]">
          {/* 사이드 탭 */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 p-4">
            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                activeTab === 'memory'
                  ? 'bg-[#c9a87c] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🧠 메모리 관리
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                activeTab === 'general'
                  ? 'bg-[#c9a87c] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              ⚙️ 일반
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'memory' ? (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  메모리 관리
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  AI가 기억할 정보를 관리합니다. 중요한 정보, 선호도, 사실 등을 저장하세요.
                </p>

                {/* 메모리 추가 */}
                <div className="flex gap-2 mb-6">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c9a87c]"
                  >
                    <option value="critical">⚠️ 중요</option>
                    <option value="preference">💜 선호</option>
                    <option value="fact">📝 사실</option>
                  </select>
                  <input
                    type="text"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="새 메모리 추가..."
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#c9a87c]"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={isAdding || !newContent.trim()}
                    className="bg-[#c9a87c] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#b89a6c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAdding ? '...' : '추가'}
                  </button>
                </div>

                {/* 메모리 목록 */}
                <div className="space-y-2">
                  {memories.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      아직 저장된 메모리가 없습니다
                    </p>
                  ) : (
                    memories.map((memory) => (
                      <div
                        key={memory.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group"
                      >
                        <span className="text-lg">
                          {getCategoryEmoji(memory.category)}
                        </span>
                        <div className="flex-1">
                          <span className="text-xs text-gray-400 block mb-1">
                            {getCategoryLabel(memory.category)}
                          </span>
                          <p className="text-sm text-gray-700">{memory.content}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(memory.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">일반 설정</h3>
                <p className="text-sm text-gray-500">
                  추가 설정은 곧 제공될 예정입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
