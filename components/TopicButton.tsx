
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
      className="text-sm font-semibold text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-lg px-2 py-2 sm:px-4 sm:py-2 hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed relative group"
      title={text}
    >
      <span className="text-lg sm:text-sm">{emoji}</span>
      <span className="hidden sm:inline ml-2">{text}</span>
      {/* Mobile tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden whitespace-nowrap rounded-lg">
        {text}
      </div>
    </button>
  );
};

export default TopicButton;
