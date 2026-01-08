'use client';

import React from 'react';
import Image from 'next/image';

interface SimpleAvatarProps {
  src?: string;
  alt: string;
  name: string;
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
}

export function SimpleAvatar({ src, alt, name, className = '', onClick }: SimpleAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const handleImageError = () => {
    console.log('SimpleAvatar: Image failed to load:', src);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('SimpleAvatar: Image loaded successfully:', src);
    setImageLoaded(true);
  };

  if (!src || imageError) {
    return (
      <div 
        className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium cursor-pointer ${className}`}
        onClick={onClick}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`relative w-8 h-8 rounded-full overflow-hidden cursor-pointer ${className}`} onClick={(e) => onClick?.(e)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        sizes="32px"
      />
      {!imageLoaded && (
        <div className="absolute inset-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
