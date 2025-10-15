
import React from 'react';

interface AvatarProps {
  size?: string;
}

const Avatar: React.FC<AvatarProps> = ({ size = 'w-16 h-16' }) => {
  return (
    <div className={`${size} rounded-full p-1 bg-gradient-to-tr from-fuchsia-500 to-pink-500 flex-shrink-0 shadow-lg`}>
      <img
        src="https://picsum.photos/seed/femaleboxer/200/200"
        alt="Coach Sammi"
        className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
      />
    </div>
  );
};

export default Avatar;