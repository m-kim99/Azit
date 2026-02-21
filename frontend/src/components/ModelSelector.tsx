// 모델 선택 드롭다운 컴포넌트
import { useState, useRef, useEffect } from 'react';

export interface ModelConfig {
  model: string;
  displayName: string;
  extendedThinking: boolean;
}

const MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5' },
  { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6' },
  { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5' },
  { id: 'claude-opus-4-6', name: 'Opus 4.6' },
];

interface ModelSelectorProps {
  value: ModelConfig;
  onChange: (config: ModelConfig) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelSelect = (modelId: string) => {
    const model = MODELS.find((m) => m.id === modelId);
    if (model) {
      onChange({
        model: model.id,
        displayName: model.name,
        extendedThinking: value.extendedThinking,
      });
    }
    setIsOpen(false);
  };

  const toggleExtendedThinking = () => {
    onChange({
      ...value,
      extendedThinking: !value.extendedThinking,
    });
  };

  const currentModel = MODELS.find((m) => m.id === value.model);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span>{currentModel?.name || 'Select Model'}</span>
        {value.extendedThinking && (
          <span className="text-xs bg-[#c9a87c] text-white px-1.5 py-0.5 rounded">
            Think
          </span>
        )}
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* 모델 선택 */}
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-400 px-2 py-1">모델 선택</p>
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  value.model === model.id
                    ? 'bg-[#f9f5f1] text-[#8b7355]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {model.id.includes('opus') ? '복잡한 작업' : '빠른 응답'}
                </span>
              </button>
            ))}
          </div>

          {/* Extended Thinking 토글 */}
          <div className="p-3">
            <button
              onClick={toggleExtendedThinking}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <span className="text-sm text-gray-700">Extended Thinking</span>
                <p className="text-xs text-gray-400">깊은 추론 모드</p>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  value.extendedThinking ? 'bg-[#c9a87c]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${
                    value.extendedThinking ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
