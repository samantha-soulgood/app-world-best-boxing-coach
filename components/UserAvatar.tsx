import React, { useState } from 'react';
import type { User } from '../types';

interface UserAvatarProps {
  user: User;
  size?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'w-8 h-8' }) => {
  const [imageError, setImageError] = useState(false);
  
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

  // Generate avatar URL using DiceBear API with a boxing theme
  const generateAvatarUrl = (userId: string): string => {
    const seed = getAvatarSeed(userId);
    // Using DiceBear's personas API with boxing-inspired styling
    // Mobile Safari-friendly URL with fewer parameters
    return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=1f2937&hairColor=262626&skinColor=edb98a&eyesColor=262626&clothingColor=ef4444&clothing=hoodie&accessoriesProbability=30&accessories=glasses&mouth=smile&eyebrows=default&glasses=round`;
  };

  // Get initials for fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarUrl = generateAvatarUrl(user.id);
  const initials = getInitials(user.name);
  
  console.log("UserAvatar Debug:", {
    userId: user.id,
    userName: user.name,
    avatarUrl,
    initials,
    imageError,
    isMobileSafari,
    userAgent: navigator.userAgent
  });

  return (
    <div className={`${size} rounded-full p-0.5 bg-gradient-to-tr from-fuchsia-500 to-pink-500 flex-shrink-0`} title={`Avatar for ${user.name}`}>
      <div className="w-full h-full rounded-full overflow-hidden border border-zinc-900 bg-zinc-800 flex items-center justify-center">
        {!imageError && !isMobileSafari ? (
          <img
            src={avatarUrl}
            alt={`${user.name}'s avatar`}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            loading="lazy"
            decoding="async"
            onError={() => {
              setImageError(true);
              console.warn(`Avatar failed to load for user: ${user.name}, falling back to initials`);
            }}
            onLoad={() => {
              console.log(`Avatar loaded successfully for user: ${user.name}`);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAvatar;
