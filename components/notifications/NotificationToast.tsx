"use client";

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getNotificationMessage } from '@/lib/notification-messages';
import { useSession } from 'next-auth/react'; // Added import for useSession

let lastNotificationId: string | null = null;

export function NotificationToast() {
    // Poll for new notifications every 30 seconds
    /*
   * FIX: 401 Unauthorized Error
   * Only fetch notifications if the user is authenticated.
   * We use the 'enabled' option in React Query to disable the fetch
   * when there is no active session.
   */
    const { data: session } = useSession();

    const { data: queryData } = useQuery({
        queryKey: ['notifications', 'unread'],
        queryFn: async () => {
            // Double check session to be safe
            if (!session?.user) return { notifications: [] };

            const res = await fetch('/api/notifications?limit=1&isRead=false');
            if (!res.ok) {
                if (res.status === 401) return { notifications: [] }; // Gracefully handle 401
                throw new Error('Failed to fetch notifications');
            }
            return res.json();
        },
        // Only run this query if we have a session
        enabled: !!session?.user,
        refetchInterval: 30000,
        staleTime: 10000,
        retry: false, // Don't retry on error (especially 401s)
        refetchOnWindowFocus: true,
    });

    const notification = queryData?.notifications?.[0] || null;

    useEffect(() => {
        if (!notification || !notification._id) return;

        // Only show toast if this is a new notification
        if (lastNotificationId !== notification._id) {
            lastNotificationId = notification._id;

            const message = getNotificationMessage(notification.type, notification.metadata);

            // Show toast with appropriate styling based on priority
            const toastOptions: any = {
                duration: 5000,
                action: notification.metadata?.actionUrl ? {
                    label: 'View',
                    onClick: () => {
                        window.location.href = notification.metadata.actionUrl;
                    }
                } : undefined,
            };

            // Use different toast styles based on priority
            if (notification.priority === 'HIGH') {
                toast.error(`${message.icon} ${message.title}`, {
                    ...toastOptions,
                    description: message.body,
                    className: 'bg-red-50 border-red-200',
                });
            } else if (notification.priority === 'MEDIUM') {
                toast.info(`${message.icon} ${message.title}`, {
                    ...toastOptions,
                    description: message.body,
                });
            } else {
                toast(`${message.icon} ${message.title}`, {
                    ...toastOptions,
                    description: message.body,
                });
            }
        }
    }, [notification]);

    // This component doesn't render anything visible
    return null;
}
