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
      setShowPlayer(true);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Searching for video:', exerciseName);
      const foundVideo = await onFindVideo(exerciseName);
      console.log('Found video:', foundVideo);
      if (foundVideo) {
        setVideo(foundVideo);
        setShowPlayer(true);
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
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg ${
          noVideoFound 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300' 
            : 'bg-stone-600 text-white hover:bg-stone-700 border border-stone-700'
        }`}
        title={noVideoFound ? `No video available for ${exerciseName}` : `Watch video for ${exerciseName}`}
      >
        <PlayIcon className="w-3 h-3" />
        {isLoading ? 'Loading...' : noVideoFound ? 'No Video' : 'Watch'}
      </button>
      
      {showPlayer && video && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-300 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{exerciseName}</h3>
              <button
                onClick={() => setShowPlayer(false)}
                className="text-gray-600 hover:text-gray-900 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-gray-700 text-sm">{video.title}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExerciseVideoButton;
