'use client';

import React, { useState } from 'react';

interface SimpleProfilePhotoProps {
  authorName: string;
  authorImage?: string;
  authorAvatar?: string;
  onClick?: () => void;
}

export function SimpleProfilePhoto({ authorName, authorImage, authorAvatar, onClick }: SimpleProfilePhotoProps) {
  const [error, setError] = useState(false);
  
  // Check if user has actual photo (not placeholder)
  const hasActualPhoto = authorImage && authorImage !== '/placeholder-user.jpg';
  const imageUrl = hasActualPhoto ? authorImage : authorAvatar;

  const handleImageError = () => {
    setError(true);
  };

  const handleImageLoad = () => {
    setError(false);
  };

  // Show "G" fallback if no actual photo or image fails to load
  if (!hasActualPhoto || error || !imageUrl) {
    return (
      <div 
        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium cursor-pointer"
        onClick={onClick}
      >
        {authorName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer" onClick={onClick}>
      <img
        src={imageUrl}
        alt={authorName}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
