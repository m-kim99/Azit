// 단일 메시지 컴포넌트
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 bg-[#c9a87c] rounded-full flex items-center justify-center text-white text-sm mr-3 flex-shrink-0">
          A
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-[#c9a87c] text-white rounded-br-md'
            : 'bg-[#f9f5f1] text-gray-800 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
