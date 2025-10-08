
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
    <header className="flex-shrink-0 bg-gradient-to-r from-orange-100 via-amber-50 to-rose-100 border-b-2 border-orange-200">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <Avatar />
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900 tracking-wider flex items-center gap-2">
                <span className="text-xl">🥊</span>
                SAMMI
              </h1>
              <p className="text-sm text-orange-700 font-display uppercase tracking-widest font-bold">Soul Good Boxing</p>
            </div>
        </div>
        {currentUser && (
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                    <UserAvatar user={currentUser} size="w-8 h-8" />
                    <span className="text-sm text-gray-600 hidden sm:block">Welcome, <span className="font-bold text-gray-900">{currentUser.name}</span></span>
                </div>
                <button
                    onClick={onLogout}
                    className="text-sm font-semibold text-orange-700 bg-white border-2 border-orange-300 px-4 py-2 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200"
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
