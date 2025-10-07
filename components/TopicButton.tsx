
import React from 'react';

interface TopicButtonProps {
    topic: string;
    onClick: () => void;
    disabled?: boolean;
}

const TopicButton: React.FC<TopicButtonProps> = ({ topic, onClick, disabled = false }) => {
  // Extract emoji and text from topic
  const emoji = topic.split(' ')[0];
  const text = topic.split(' ').slice(1).join(' ');
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm font-medium text-fuchsia-300 bg-zinc-800/80 border border-zinc-700 rounded-lg px-2 py-2 sm:px-4 sm:py-2 hover:bg-zinc-700 hover:text-fuchsia-200 transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed relative group"
      title={text}
    >
      <span className="text-lg sm:text-sm">{emoji}</span>
      <span className="hidden sm:inline ml-2">{text}</span>
      {/* Mobile tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden whitespace-nowrap">
        {text}
      </div>
    </button>
  );
};

export default TopicButton;
