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
      
      <svg className="absolute w-full h-full transform -rotate-90">
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isVeryLowTime ? '#ef4444' : isLowTime ? '#f97316' : '#a855f7'} />
            <stop offset="100%" stopColor={isVeryLowTime ? '#dc2626' : isLowTime ? '#ea580c' : '#9333ea'} />
          </linearGradient>
        </defs>
        <circle
          stroke="url(#progressGradient)"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset()}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="z-10 flex flex-col items-center justify-center">
        {/* Time display */}
        <span className={`text-[2.2rem] sm:text-[2.8rem] leading-none font-mono font-bold tracking-tight transition-all duration-500 ${
          isVeryLowTime ? 'text-red-400 animate-pulse' : 
          isLowTime ? 'text-orange-400' : 'text-white'
        }`}>
          {formatTime(seconds)}
        </span>
        
        {/* Control button */}
        <button 
          onClick={toggle} 
          className={`mt-4 p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
            isActive && !isPaused 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300' 
              : 'bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 hover:text-fuchsia-300'
          } backdrop-blur-sm border border-white/10`} 
          aria-label={isActive ? 'Pause timer' : 'Start timer'}
        >
          {isActive && !isPaused ? (
            <PauseIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Timer;
