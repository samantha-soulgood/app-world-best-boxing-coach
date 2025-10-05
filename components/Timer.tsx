import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon } from './icons';

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

  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          className="text-zinc-700"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
        <circle
          className="text-fuchsia-500 transition-all duration-1000 linear"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset()}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
      </svg>
      <div className="z-10 flex flex-col items-center justify-center">
        <span className="text-[2rem] sm:text-[2.5rem] leading-none font-display font-bold text-white tracking-tighter">
          {formatTime(seconds)}
        </span>
        <button onClick={toggle} className="mt-1 text-white/80 hover:text-white transition-colors" aria-label={isActive ? 'Pause timer' : 'Start timer'}>
          {isActive && !isPaused ? <PauseIcon className="w-6 h-6 sm:w-8 sm:h-8" /> : <PlayIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
        </button>
      </div>
    </div>
  );
};

export default Timer;
