'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface GanpatAvatarProps {
  project: any;
  onClick?: (e?: React.MouseEvent<Element>) => void;
}

export function GanpatAvatar({ project, onClick }: GanpatAvatarProps) {
  const [profilePhoto, setProfilePhoto] = useState<string>('/placeholder-user.jpg');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Direct database fetch for ganpat's profile photo
    const fetchGanpatProfilePhoto = async () => {
      try {
        setLoading(true);
        console.log('🔍 Direct fetch: Getting ganpat profile photo...');
        
        // Create a simple API endpoint that works
        const response = await fetch('/api/projects');
        const projects = await response.json();
        const ganpatProject = projects.find(p => p.author?.name === 'ganpat');
        
        if (ganpatProject && ganpatProject.author?.image) {
          console.log('✅ Found ganpat project with image:', ganpatProject.author.image);
          setProfilePhoto(ganpatProject.author.image);
        } else {
          console.log('⚠️ No image found in project, using placeholder');
          setProfilePhoto('/placeholder-user.jpg');
        }
      } catch (error) {
        console.log('❌ Error fetching profile photo:', error);
        setProfilePhoto('/placeholder-user.jpg');
      } finally {
        setLoading(false);
      }
    };

    fetchGanpatProfilePhoto();
  }, []);

  const handleImageError = () => {
    console.log('GanpatAvatar: Image failed to load:', profilePhoto);
    setError(true);
  };

  const handleImageLoad = () => {
    console.log('GanpatAvatar: Image loaded successfully:', profilePhoto);
    setError(false);
  };

  if (loading) {
    return (
      <div 
        className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium cursor-pointer"
        onClick={(e) => onClick?.(e)}
      >
        G
      </div>
    );
  }

  if (error || !profilePhoto) {
    return (
      <div 
        className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium cursor-pointer"
        onClick={(e) => onClick?.(e)}
      >
        G
      </div>
    );
  }

  return (
    <div className="relative h-8 w-8 rounded-full overflow-hidden cursor-pointer" onClick={(e) => onClick?.(e)}>
      <Image
        src={profilePhoto}
        alt={project.author.name}
        fill
        className="object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        sizes="32px"
      />
      {!error && (
        <div className="absolute inset-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
          G
        </div>
      )}
    </div>
  );
}
