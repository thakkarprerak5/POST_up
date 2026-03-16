'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BanBannerProps {
  banReason?: string;
  banExpiresAt?: string;
}

export function BanBanner({ banReason, banExpiresAt }: BanBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!banExpiresAt) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(banExpiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [banExpiresAt]);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 relative">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Account Restricted
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              {banReason || 'Your account has been restricted due to policy violations.'}
            </p>
            {banExpiresAt && timeRemaining && timeRemaining !== 'Expired' && (
              <div className="flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span>Restriction ends in: {timeRemaining}</span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="text-yellow-700 border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
