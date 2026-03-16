"use client";

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ShieldAlert,
    ShieldX,
    UserCheck,
    UserX,
    FolderCheck,
    FolderX,
    UserMinus,
    Bell,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NotificationItemProps {
    notification: {
        _id: string;
        type: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        isRead: boolean;
        metadata: {
            targetTitle?: string;
            projectTitle?: string;
            mentorName?: string;
            reason?: string;
            actionUrl?: string;
        };
        createdAt: string;
    };
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const iconMap: Record<string, any> = {
    ADMIN_WARNING: ShieldAlert,
    ADMIN_BAN: ShieldX,
    MENTOR_ACCEPTED: UserCheck,
    MENTOR_REJECTED: UserX,
    PROJECT_APPROVED: FolderCheck,
    PROJECT_REJECTED: FolderX,
    ASSIGNMENT_REMOVED: UserMinus,
    SYSTEM_ANNOUNCEMENT: Bell,
};

const priorityConfig = {
    HIGH: {
        borderColor: 'border-l-destructive',
        bgColor: 'bg-destructive/5',
        iconColor: 'text-destructive',
        textColor: 'text-destructive',
    },
    MEDIUM: {
        borderColor: 'border-l-primary',
        bgColor: 'bg-primary/5',
        iconColor: 'text-primary',
        textColor: 'text-primary',
    },
    LOW: {
        borderColor: 'border-l-muted-foreground',
        bgColor: 'bg-muted/30',
        iconColor: 'text-muted-foreground',
        textColor: 'text-muted-foreground',
    },
};

const getNotificationMessage = (notification: NotificationItemProps['notification']) => {
    const { type, metadata } = notification;

    switch (type) {
        case 'MENTOR_ACCEPTED':
            return `${metadata.mentorName} accepted your project "${metadata.projectTitle}"`;
        case 'MENTOR_REJECTED':
            return `${metadata.mentorName} declined your project "${metadata.projectTitle}"${metadata.reason ? `: ${metadata.reason}` : ''
                }`;
        case 'PROJECT_APPROVED':
            return `Your project "${metadata.projectTitle}" has been approved`;
        case 'PROJECT_REJECTED':
            return `Your project "${metadata.projectTitle}" was not approved${metadata.reason ? `: ${metadata.reason}` : ''
                }`;
        case 'ADMIN_WARNING':
            return `Admin Warning: ${metadata.reason}`;
        case 'ADMIN_BAN':
            return `Your account has been restricted: ${metadata.reason}`;
        case 'ASSIGNMENT_REMOVED':
            return `Your assignment for "${metadata.projectTitle}" was removed${metadata.reason ? `: ${metadata.reason}` : ''
                }`;
        case 'SYSTEM_ANNOUNCEMENT':
            return metadata.reason || 'New system announcement';
        default:
            return 'New notification';
    }
};

export function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
}: NotificationItemProps) {
    const router = useRouter();
    const Icon = iconMap[notification.type] || Bell;
    const config = priorityConfig[notification.priority];

    const handleClick = async () => {
        // Mark as read
        if (!notification.isRead) {
            onMarkAsRead(notification._id);
        }

        // Navigate if actionUrl exists
        if (notification.metadata.actionUrl) {
            router.push(notification.metadata.actionUrl);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (notification.priority === 'HIGH') {
            toast.error('HIGH priority notifications cannot be deleted');
            return;
        }

        onDelete(notification._id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'group relative border-l-4 rounded-lg p-4 transition-all duration-200 cursor-pointer',
                'hover:shadow-md hover:scale-[1.01]',
                config.borderColor,
                notification.isRead ? 'bg-background' : config.bgColor
            )}
            onClick={handleClick}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                        notification.isRead ? 'bg-muted' : config.bgColor
                    )}
                >
                    <Icon className={cn('w-5 h-5', config.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            'text-sm leading-relaxed',
                            notification.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'
                        )}
                    >
                        {getNotificationMessage(notification)}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                </div>

                {/* Delete Button (hidden for HIGH priority) */}
                {notification.priority !== 'HIGH' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                )}

                {/* Unread indicator */}
                {!notification.isRead && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                )}
            </div>
        </motion.div>
    );
}
