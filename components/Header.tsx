import React from 'react';
import { LogoIcon, VolumeOnIcon, VolumeOffIcon } from './Icons';

interface HeaderProps {
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSoundEnabled, onToggleSound }) => {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 shadow-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex-1"></div> {/* Left spacer */}
        
        <div className="flex items-center justify-center space-x-3">
          <LogoIcon className="w-8 h-8" />
          <h1 className="text-xl md:text-2xl font-bold tracking-wider text-gray-900 uppercase">
            Soul Good <span className="text-rose-500">Boxing</span>
          </h1>
        </div>

        <div className="flex-1 flex justify-end"> {/* Right container for button */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label={isSoundEnabled ? "Disable sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? <VolumeOnIcon className="w-6 h-6" /> : <VolumeOffIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;