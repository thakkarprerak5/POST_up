'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export function ProfilePhotoModal({ isOpen, onClose, imageUrl, alt = "Profile photo" }: ProfilePhotoModalProps) {
  // Remove debug console.log to prevent spam
  // console.log('📸 ProfilePhotoModal render:', { isOpen, imageUrl, alt });

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      console.log('⌨️ Escape key pressed, closing modal');
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Dark blurred background overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className="relative z-10 flex flex-col items-center max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 fade-in-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Profile photo container */}
        <div className="relative rounded-full overflow-hidden shadow-2xl">
          {imageUrl && imageUrl.trim() ? (
            <Image
              src={imageUrl}
              alt={alt}
              width={800}
              height={800}
              className="object-cover max-w-[80vw] max-h-[80vh] w-auto h-auto rounded-full"
              priority
              sizes="(max-width: 768px) 80vw, 800px"
              style={{
                maxHeight: '80vh',
                maxWidth: '80vh',
                minWidth: '200px',
                minHeight: '200px',
              }}
            />
          ) : (
            <div className="w-48 h-48 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-4xl font-bold">
                {alt.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User info below photo */}
        <div className="mt-4 text-center">
          <p className="text-white font-medium">{alt}</p>
        </div>
      </div>
    </div>
  );
}
