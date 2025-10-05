
import React from 'react';
import Avatar from './Avatar';
import UserAvatar from './UserAvatar';
import type { User } from '../types';

interface HeaderProps {
    currentUser: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="flex-shrink-0 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-700/50 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <Avatar />
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-wider">SAMMI</h1>
              <p className="text-sm text-fuchsia-400 font-display uppercase tracking-widest">Soul Good Boxing</p>
            </div>
        </div>
        {currentUser && (
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                    <UserAvatar user={currentUser} size="w-8 h-8" />
                    <span className="text-sm text-gray-300 hidden sm:block">Welcome, <span className="font-bold text-white">{currentUser.name}</span></span>
                </div>
                <button
                    onClick={onLogout}
                    className="text-sm font-medium text-fuchsia-300 bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-2 hover:bg-zinc-700 hover:text-fuchsia-200 transition-all duration-200"
                >
                    Logout
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
