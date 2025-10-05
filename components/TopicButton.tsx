
import React from 'react';

interface TopicButtonProps {
    topic: string;
    onClick: () => void;
    disabled?: boolean;
}

const TopicButton: React.FC<TopicButtonProps> = ({ topic, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm font-medium text-fuchsia-300 bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-2 hover:bg-zinc-700 hover:text-fuchsia-200 transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {topic}
    </button>
  );
};

export default TopicButton;
