'use client';

import { useState } from 'react';
import { useId } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface Notification {
    _id: string;
    type: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    isRead: boolean;
    metadata: {
        message?: string;
        actionUrl?: string;
        projectTitle?: string;
        mentorName?: string;
        reason?: string;
        targetTitle?: string;
        [key: string]: any;
    };
    createdAt: string;
    senderId?: string;
}

const NOTIFICATION_ICONS: Record<string, string> = {
    MENTOR_ACCEPTED: '✅',
    MENTOR_REJECTED: '❌',
    MENTOR_ASSIGNED: '👨‍🏫',
    PROJECT_APPROVED: '🎉',
    PROJECT_REJECTED: '⛔',
    GROUP_CREATED: '👥',
    GROUP_MEMBER_ADDED: '👥',
    LIKE: '❤️',
    COMMENT: '💬',
    ADMIN_WARNING: '⚠️',
    BAN_WARNING: '🚫',
    SOFT_BAN_ISSUED: '🔒',
    PROPER_BAN_ISSUED: '🔒',
    ACCOUNT_RESTORED: '🔓',
    NEW_REPORT_FILED: '📋',
    MENTOR_ACTIVITY_ALERT: '📊',
    MENTOR_INVITATION_RECEIVED: '📨',
    STUDENT_ASSIGNED: '👨‍🎓',
    SYSTEM_ANNOUNCEMENT: '📢',
    ASSIGNMENT_REMOVED: '🗑️',
    REPORT_RESOLVED: '✅',
    FOLLOW: '👤',
    MENTION: '@',
};

const NOTIFICATION_MESSAGES: Record<string, (metadata: any) => string> = {
    MENTOR_ACCEPTED: (m) => `${m.mentorName || 'A mentor'} accepted your project "${m.projectTitle || 'your project'}"`,
    MENTOR_REJECTED: (m) => `${m.mentorName || 'A mentor'} rejected your project "${m.projectTitle || 'your project'}"`,
    MENTOR_ASSIGNED: (m) => `${m.mentorName || 'A mentor'} was assigned to your project`,
    PROJECT_APPROVED: (m) => `Your project "${m.projectTitle || 'your project'}" was approved!`,
    PROJECT_REJECTED: (m) => `Your project "${m.projectTitle || 'your project'}" was rejected`,
    GROUP_CREATED: (m) => `You were added to the group "${m.targetTitle || 'a group'}"`,
    GROUP_MEMBER_ADDED: (m) => `You were added to "${m.targetTitle || 'a group'}"`,
    LIKE: (m) => `Someone liked your ${m.targetType || 'content'}`,
    COMMENT: (m) => `New comment on your ${m.targetType || 'content'}`,
    ADMIN_WARNING: (m) => m.reason || 'You received an admin warning',
    BAN_WARNING: (m) => m.reason || 'Your account has been flagged',
    SOFT_BAN_ISSUED: (m) => m.reason || 'Your account has been temporarily restricted',
    PROPER_BAN_ISSUED: (m) => m.reason || 'Your account has been banned',
    ACCOUNT_RESTORED: (m) => 'Your account has been restored',
    NEW_REPORT_FILED: (m) => `New report filed: ${m.reason || 'Check admin panel'}`,
    MENTOR_ACTIVITY_ALERT: (m) => m.reason || 'Mentor activity update',
    MENTOR_INVITATION_RECEIVED: (m) => `New mentoring invitation for "${m.projectTitle || 'a project'}"`,
    STUDENT_ASSIGNED: (m) => 'A student was assigned to you',
    SYSTEM_ANNOUNCEMENT: (m) => m.reason || 'System announcement',
    ASSIGNMENT_REMOVED: (m) => 'Mentor assignment removed',
    REPORT_RESOLVED: (m) => 'Your report has been resolved',
    FOLLOW: (m) => 'Someone followed you',
    MENTION: (m) => 'You were mentioned in a post',
};

/**
 * Safe date formatter to prevent "Invalid Date" errors
 */
function safeFormatDate(dateString: string | undefined): string {
    try {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Recently';
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        return 'Recently';
    }
}

export default function NotificationBell() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    
    // Generate stable ID for Popover to prevent hydration mismatches
    const popoverId = useId();

    // Fetch notifications with defensive data handling
    const { data: notificationsResponse } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();

            // Defensive: Handle different response structures
            return {
                notifications: Array.isArray(data.notifications) ? data.notifications : [],
                unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
                hasHighPriority: Boolean(data.hasHighPriority),
            };
        },
        refetchInterval: 10000, // Poll every 10 seconds
        refetchIntervalInBackground: false,
        staleTime: 5000,
        initialData: {
            notifications: [],
            unreadCount: 0,
            hasHighPriority: false,
        },
    });

    // Defensive: Ensure notifications is always an array
    const notifications: Notification[] = Array.isArray(notificationsResponse?.notifications)
        ? notificationsResponse.notifications
        : [];

    const unreadCount = notificationsResponse?.unreadCount || 0;

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
            });
            if (!res.ok) throw new Error('Failed to mark as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllAsRead: true }),
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        },
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const res = await fetch(`/api/notifications?notificationId=${notificationId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete notification');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notification deleted');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification._id);
        }

        // Navigate if actionUrl exists
        if (notification.metadata?.actionUrl) {
            setIsOpen(false);
            router.push(notification.metadata.actionUrl);
        }
    };

    const handleDelete = (e: React.MouseEvent, notificationId: string, priority: string) => {
        e.stopPropagation();

        // Prevent deletion of HIGH priority notifications
        if (priority === 'HIGH') {
            toast.error('High priority notifications cannot be deleted');
            return;
        }

        deleteNotificationMutation.mutate(notificationId);
    };

    const handleMarkAllAsRead = () => {
        if (unreadCount > 0) {
            markAllAsReadMutation.mutate();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                    aria-controls={popoverId}
                >
                    <Bell className="h-5 w-5" />
                    {/* PRD REQUIREMENT: Hide badge completely when count is 0 */}
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent 
                id={popoverId}
                className="w-96 p-0" 
                align="end"
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {/* Defensive: Check if notifications is array and has length */}
                    {!Array.isArray(notifications) || notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Bell className="h-12 w-12 mb-4 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {/* Safe map with array check */}
                            {Array.isArray(notifications) && notifications.map((notification) => {
                                // Defensive: Ensure notification has required fields
                                if (!notification || !notification._id) return null;

                                return (
                                    <motion.div
                                        key={notification._id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className={`
                      p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors
                      ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                      ${notification.priority === 'HIGH' ? 'border-l-4 border-l-red-500' : ''}
                    `}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl flex-shrink-0">
                                                {NOTIFICATION_ICONS[notification.type] || '🔔'}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-2">
                                                    {NOTIFICATION_MESSAGES[notification.type]?.(notification.metadata || {}) ||
                                                        notification.metadata?.message ||
                                                        'New notification'}
                                                </p>

                                                {/* Safe date formatting */}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {safeFormatDate(notification.createdAt)}
                                                </p>
                                            </div>

                                            {notification.priority !== 'HIGH' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    onClick={(e) => handleDelete(e, notification._id, notification.priority)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
