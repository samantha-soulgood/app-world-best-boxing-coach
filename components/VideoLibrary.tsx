import React from 'react';
import { videoLibrary } from '../videos';
import type { Video } from '../types';
import { CloseIcon, FilmIcon, PlayIcon } from './icons';

interface VideoLibraryProps {
  onClose: () => void;
  onSelectVideo: (video: Video) => void;
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({ onClose, onSelectVideo }) => {
  return (
    <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700 flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-zinc-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FilmIcon className="w-6 h-6 text-fuchsia-400" />
            <h2 className="text-xl font-display font-bold text-white tracking-wider">Video Drills</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>
        <div className="overflow-y-auto p-4">
          <ul className="space-y-2">
            {videoLibrary.map((video) => (
              <li key={video.id}>
                <button
                  onClick={() => onSelectVideo(video)}
                  className="w-full text-left p-4 bg-zinc-900 rounded-lg hover:bg-zinc-700/80 transition-colors duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-200 group-hover:text-white">{video.title}</span>
                    <PlayIcon className="w-6 h-6 text-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoLibrary;
