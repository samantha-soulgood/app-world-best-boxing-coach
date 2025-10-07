import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon } from './Icons';

interface TimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
  isPaused?: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onComplete, autoStart = false, isPaused = false }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    console.log('Timer resetting: new initialSeconds =', initialSeconds, 'autoStart =', autoStart);
    setSeconds(initialSeconds);
    setIsActive(autoStart);
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    // FIX: Use `window.setInterval` to avoid type conflict with NodeJS.Timeout.
    // The browser's setInterval returns a number, which is expected here.
    let interval: number | undefined;
    if (isActive && !isPaused && seconds > 0) {
      interval = window.setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      if (onComplete) {
        onComplete();
      }
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, seconds, onComplete, isPaused]);

  const toggle = () => {
    if (seconds > 0) {
        setIsActive(!isActive);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = () => {
    if (initialSeconds === 0) return circumference;
    return circumference - (seconds / initialSeconds) * circumference;
  };

  const progressPercentage = initialSeconds > 0 ? (seconds / initialSeconds) * 100 : 100;
  const isLowTime = progressPercentage <= 20;
  const isVeryLowTime = progressPercentage <= 10;

  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
      {/* Background glow effect */}
      <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
        isVeryLowTime ? 'bg-red-500/30' : isLowTime ? 'bg-orange-500/20' : 'bg-fuchsia-500/20'
      }`} />
      
      {/* Outer ring */}
      <div className="absolute inset-2 rounded-full border border-zinc-800/50" />
      
      <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-lg">
        {/* Background circle */}
        <circle
          className="text-zinc-800/60"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isVeryLowTime ? '#ef4444' : isLowTime ? '#f97316' : '#a855f7'} />
            <stop offset="100%" stopColor={isVeryLowTime ? '#dc2626' : isLowTime ? '#ea580c' : '#9333ea'} />
          </linearGradient>
        </defs>
        <circle
          stroke="url(#progressGradient)"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset()}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
          className="transition-all duration-1000 ease-out drop-shadow-lg"
          style={{
            filter: isVeryLowTime ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' : 
                   isLowTime ? 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.4))' :
                   'drop-shadow(0 0 4px rgba(168, 85, 247, 0.3))'
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="z-10 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Time display with enhanced typography */}
          <span className={`text-[2.2rem] sm:text-[2.8rem] leading-none font-mono font-bold tracking-tight transition-all duration-500 ${
            isVeryLowTime ? 'text-red-400 animate-pulse' : 
            isLowTime ? 'text-orange-400' : 'text-white'
          }`}>
            {formatTime(seconds)}
          </span>
          
          {/* Progress percentage (optional, can be removed) */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className={`text-[0.6rem] font-mono transition-colors duration-500 ${
              isVeryLowTime ? 'text-red-400/70' : 
              isLowTime ? 'text-orange-400/70' : 'text-zinc-500'
            }`}>
              {Math.round(progressPercentage)}%
            </div>
          </div>
        </div>
        
        {/* Control button with modern styling */}
        <button 
          onClick={toggle} 
          className={`mt-3 p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
            isActive && !isPaused 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300' 
              : 'bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 hover:text-fuchsia-300'
          } backdrop-blur-sm border border-white/10`} 
          aria-label={isActive ? 'Pause timer' : 'Start timer'}
        >
          {isActive && !isPaused ? (
            <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Timer;
