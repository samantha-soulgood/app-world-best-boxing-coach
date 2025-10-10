import React, { useState } from 'react';
import type { Video } from '../types';
import { PlayIcon } from './Icons';

interface ExerciseVideoButtonProps {
  exerciseName: string;
  onFindVideo: (exerciseName: string) => Promise<Video | null>;
  disabled?: boolean;
}

const ExerciseVideoButton: React.FC<ExerciseVideoButtonProps> = ({ 
  exerciseName, 
  onFindVideo, 
  disabled = false 
}) => {
  console.log("ExerciseVideoButton: Rendering for exercise:", exerciseName);
  console.log("ExerciseVideoButton: onFindVideo prop:", !!onFindVideo);
  
  const [isLoading, setIsLoading] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [noVideoFound, setNoVideoFound] = useState(false);

  const handleClick = async () => {
    if (video) {
      // Open YouTube search in a new tab
      window.open(video.watchUrl, '_blank');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Searching for video:', exerciseName);
      const foundVideo = await onFindVideo(exerciseName);
      console.log('Found video:', foundVideo);
      if (foundVideo) {
        setVideo(foundVideo);
        // Immediately open YouTube search in a new tab
        window.open(foundVideo.watchUrl, '_blank');
        setNoVideoFound(false);
      } else {
        console.log('No video found for:', exerciseName);
        setNoVideoFound(true);
      }
    } catch (error) {
      console.error('Error finding video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("ExerciseVideoButton: About to render button for:", exerciseName);
  console.log("ExerciseVideoButton: isLoading:", isLoading, "noVideoFound:", noVideoFound);
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg ${
        noVideoFound 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300' 
          : 'bg-stone-600 text-white hover:bg-stone-700 border border-stone-700'
      }`}
      title={noVideoFound ? `No video available for ${exerciseName}` : `Find video tutorials for ${exerciseName} on YouTube`}
    >
      <PlayIcon className="w-3 h-3" />
      {isLoading ? 'Loading...' : noVideoFound ? 'No Video' : 'Find Video'}
    </button>
  );
};

export default ExerciseVideoButton;
