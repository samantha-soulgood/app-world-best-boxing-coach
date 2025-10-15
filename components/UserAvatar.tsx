import React, { useState } from 'react';
import type { User } from '../types';

interface UserAvatarProps {
  user: User;
  size?: string;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'w-8 h-8', onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  
  // Check if we're on mobile Safari and force initials fallback
  const isMobileSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
  
  // Generate a consistent seed based on user ID
  const getAvatarSeed = (userId: string): string => {
    // Create a hash-like seed from the user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  };

  // Generate avatar URLs using multiple fallback services
  const generateAvatarUrls = (userId: string): string[] => {
    const seed = getAvatarSeed(userId);
    return [
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1f2937&color=ffffff&size=200&format=png`,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=1f2937&textColor=ffffff&size=200`,
      `https://www.gravatar.com/avatar/${seed}?d=identicon&s=200&f=y`
    ];
  };

  const avatarUrls = generateAvatarUrls(user.id);
  const currentAvatarUrl = avatarUrls[currentServiceIndex];

  // Get initials for fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(user.name);
  
  // Handle image load error with fallback to next service
  const handleImageError = () => {
    console.warn(`Avatar service ${currentServiceIndex} failed for user: ${user.name}`);
    if (currentServiceIndex < avatarUrls.length - 1) {
      // Try next service
      setCurrentServiceIndex(prev => prev + 1);
      console.log(`Trying next avatar service: ${currentServiceIndex + 1}`);
    } else {
      // All services failed, fall back to initials
      setImageError(true);
      console.warn(`All avatar services failed for user: ${user.name}, falling back to initials`);
    }
  };

  const handleImageLoad = () => {
    console.log(`Avatar loaded successfully for user: ${user.name} using service ${currentServiceIndex}`);
  };
  
  return (
    <div 
      className={`${size} rounded-full p-0.5 bg-gradient-to-tr from-orange-400 to-amber-400 flex-shrink-0 ${onClick ? 'cursor-pointer hover:from-orange-500 hover:to-amber-500 transition-all' : ''}`} 
      title={onClick ? `Click to edit profile` : `Avatar for ${user.name}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="w-full h-full rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
        {!imageError && !isMobileSafari ? (
          <img
            key={currentServiceIndex} // Force re-render when service changes
            src={currentAvatarUrl}
            alt={`${user.name}'s avatar`}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold text-sm">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAvatar;
