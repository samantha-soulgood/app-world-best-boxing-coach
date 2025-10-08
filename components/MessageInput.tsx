
import React, { useState, KeyboardEvent } from 'react';
import { SendIcon } from './Icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Ask Sammi anything... 💬"
        className="w-full bg-white border-2 border-orange-200 rounded-lg p-3 sm:p-4 pr-12 sm:pr-16 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none resize-none transition-all duration-200"
        rows={1}
        disabled={isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 text-gray-900 bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 border-2 border-orange-300 rounded-full"
      >
        <SendIcon />
      </button>
    </div>
  );
};

export default MessageInput;
