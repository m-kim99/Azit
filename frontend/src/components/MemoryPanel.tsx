// 메모리 표시 패널 (선택적 컴포넌트)
import { useState } from 'react';
import type { Memory } from '../types';
import { addMemory, deleteMemory } from '../api/chat';

interface MemoryPanelProps {
  memories: Memory[];
  onMemoriesChange: () => void;
}

export default function MemoryPanel({ memories, onMemoriesChange }: MemoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('fact');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
        title="메모리 보기"
      >
        🧠
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-white shadow-xl rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex justify-between items-center">
        <h3 className="font-bold">🧠 기억들</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-2">
        {memories.length === 0 ? (
          <p className="text-gray-400 text-center py-4">아직 저장된 기억이 없어요</p>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg group"
            >
              <span>{getCategoryEmoji(memory.category)}</span>
              <p className="flex-1 text-sm text-gray-700">{memory.content}</p>
              <button
                onClick={() => handleDelete(memory.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4 space-y-2">
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="text-sm border rounded-lg px-2 py-1"
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
            placeholder="새 기억 추가..."
            className="flex-1 text-sm border rounded-lg px-3 py-1"
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !newContent.trim()}
            className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? '...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}
