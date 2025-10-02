import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce ml-1" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce ml-1" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
};

export default LoadingSpinner;