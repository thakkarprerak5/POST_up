'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfilePhotoModal } from '@/components/profile-photo-modal';

interface ClickableProfilePhotoProps {
    imageUrl?: string;
    avatar?: string;
    name: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
    fallbackOnly?: boolean;
    onClick?: () => void;
    onPhotoClick?: (imageUrl: string, name: string) => void;
}

const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
};

export function ClickableProfilePhoto({
    imageUrl,
    avatar,
    name,
    className = '',
    size = 'md',
    fallbackOnly = false,
    onClick,
    onPhotoClick
}: ClickableProfilePhotoProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Determine which image to use
    const finalImageUrl = imageUrl && imageUrl.trim() && imageUrl !== '' && imageUrl !== '/placeholder.svg' && imageUrl !== '/placeholder-user.jpg'
        ? imageUrl
        : avatar;

    const handlePhotoClick = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        // Use external handler if provided, otherwise use internal modal
        if (onPhotoClick) {
            onPhotoClick(finalImageUrl || '', name);
        } else if (!fallbackOnly && finalImageUrl && finalImageUrl !== '/placeholder.svg' && finalImageUrl !== '/placeholder-user.jpg') {
            setIsModalOpen(true);
        } else {
            // Fall back to custom onClick or default behavior
            onClick?.();
        }
    };

    return (
        <>
            <Avatar
                className={`${size === 'custom' ? '' : sizeClasses[size]} cursor-pointer ${className}`}
                onClick={handlePhotoClick}
            >
                <AvatarImage
                    src={finalImageUrl && finalImageUrl.trim() ? finalImageUrl : '/placeholder-user.jpg'}
                    alt={name}
                    onError={(e) => {
                        // Only log error if it's not the placeholder image
                        if (finalImageUrl && finalImageUrl !== '/placeholder-user.jpg') {
                            console.log('🖼️ Image failed to load:', finalImageUrl);
                        }
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-user.jpg';
                    }}
                />
                <AvatarFallback>
                    {(name || 'User').charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <ProfilePhotoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={finalImageUrl || '/placeholder-user.jpg'}
                alt={name}
            />
        </>
    );
}
