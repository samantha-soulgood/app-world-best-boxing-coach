import React from 'react';
import type { Video } from '../types';
import { CloseIcon } from './icons';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const embedUrl = `https://www.youtube.com/embed/${video.id}`;
  // Dynamically create the embed URL with the required origin parameter for robust embedding.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrlWithParams = embedUrl ? `${embedUrl}?autoplay=1&origin=${encodeURIComponent(origin)}` : '';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-black rounded-lg shadow-2xl overflow-hidden aspect-video" onClick={(e) => e.stopPropagation()}>
        <button
            onClick={onClose}
            className="absolute -top-1 -right-1 z-20 p-2 bg-zinc-800/80 rounded-full text-gray-300 hover:text-white hover:bg-zinc-700 transition-colors"
            aria-label="Close video player"
        >
            <CloseIcon />
        </button>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrlWithParams}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default VideoPlayer;
