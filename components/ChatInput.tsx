import React, { useState } from 'react';
import { SendIcon } from './Icons';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 sticky bottom-0">
      <div className="max-w-3xl mx-auto flex items-center space-x-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask Sammi for a plan or advice..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none transition-shadow disabled:bg-gray-100"
          rows={1}
          disabled={isLoading}
          style={{ minHeight: '44px', maxHeight: '150px' }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 flex-shrink-0"
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <SendIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;