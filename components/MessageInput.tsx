
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
        placeholder="Ask Sammi anything..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 sm:p-4 pr-12 sm:pr-16 text-gray-200 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none transition-all duration-200"
        rows={1}
        disabled={isLoading}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full text-white bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <SendIcon />
      </button>
    </div>
  );
};

export default MessageInput;
