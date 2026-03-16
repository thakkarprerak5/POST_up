import Notification, {
    NotificationType,
    NotificationPriority,
    INotificationMetadata,
    createNotificationRecord,
} from '@/models/Notification';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

/**
 * Central utility function to create notifications
 * This is the SINGLE SOURCE OF TRUTH for notification creation
 */
export async function createNotification({
    recipientId,
    senderId,
    type,
    priority,
    metadata,
}: {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    priority: NotificationPriority;
    metadata: INotificationMetadata;
}) {
    try {
        await connectDB();

        // Ensure IDs are strings for the schema if needed, or handle ObjectId conversion in model
        // The model expects Schema.Types.ObjectId, so we should pass valid ObjectId strings

        console.log('📝 Creating notification record:', { recipientId, type });

        const notification = await createNotificationRecord({
            recipientId: recipientId.toString(),
            senderId: senderId ? senderId.toString() : undefined,
            type,
            priority,
            metadata,
            isRead: false,
        } as any);

        console.log('✅ Notification created:', {
            id: notification._id,
            type,
            priority,
            recipientId,
        });

        // File logging for debug
        try {
            const { logDebug } = require('./debug-logger');
            logDebug('CREATE_NOTIFICATION', {
                type,
                recipientId,
                senderId,
                notificationId: notification._id
            });
        } catch (e) { console.error('Log error', e); }

        return notification;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
}

/**
 * Helper functions for common notification types
 */

export async function notifyProjectApproved({
    recipientId,
    projectId,
    projectTitle,
}: {
    recipientId: string;
    projectId: string;
    projectTitle: string;
}) {
    return createNotification({
        recipientId,
        type: 'PROJECT_APPROVED',
        priority: 'MEDIUM',
        metadata: {
            targetType: 'project',
            targetId: projectId,
            targetTitle: projectTitle,
            projectId,
            projectTitle,
            actionUrl: `/projects/${projectId}`,
        },
    });
}

export async function notifyProjectRejected({
    recipientId,
    projectId,
    projectTitle,
    reason,
}: {
    recipientId: string;
    projectId: string;
    projectTitle: string;
    reason?: string;
}) {
    return createNotification({
        recipientId,
        type: 'PROJECT_REJECTED',
        priority: 'MEDIUM',
        metadata: {
            targetType: 'project',
            targetId: projectId,
            targetTitle: projectTitle,
            projectId,
            projectTitle,
            reason,
            actionUrl: `/projects/${projectId}`,
        },
    });
}

export async function notifyMentorAccepted({
    recipientId,
    senderId,
    mentorName,
    projectId,
    projectTitle,
}: {
    recipientId: string;
    senderId: string;
    mentorName: string;
    projectId: string;
    projectTitle: string;
}) {
    return createNotification({
        recipientId,
        senderId,
        type: 'MENTOR_ACCEPTED',
        priority: 'MEDIUM',
        metadata: {
            mentorName,
            projectId,
            projectTitle,
            actionUrl: `/projects/${projectId}`,
        },
    });
}

export async function notifyMentorRejected({
    recipientId,
    senderId,
    mentorName,
    projectId,
    projectTitle,
    reason,
}: {
    recipientId: string;
    senderId: string;
    mentorName: string;
    projectId: string;
    projectTitle: string;
    reason?: string;
}) {
    return createNotification({
        recipientId,
        senderId,
        type: 'MENTOR_REJECTED',
        priority: 'MEDIUM',
        metadata: {
            mentorName,
            projectId,
            projectTitle,
            reason,
            actionUrl: `/projects/${projectId}`,
        },
    });
}

export async function notifyAdminWarning({
    recipientId,
    reason,
}: {
    recipientId: string;
    reason: string;
}) {
    return createNotification({
        recipientId,
        type: 'ADMIN_WARNING',
        priority: 'HIGH',
        metadata: {
            reason,
            actionUrl: '/profile',
        },
    });
}

export async function notifyAdminBan({
    recipientId,
    reason,
}: {
    recipientId: string;
    reason: string;
}) {
    return createNotification({
        recipientId,
        type: 'ADMIN_BAN',
        priority: 'HIGH',
        metadata: {
            reason,
            actionUrl: '/profile',
        },
    });
}

export async function notifyAssignmentRemoved({
    recipientId,
    projectId,
    projectTitle,
    reason,
}: {
    recipientId: string;
    projectId: string;
    projectTitle: string;
    reason?: string;
}) {
    return createNotification({
        recipientId,
        type: 'ASSIGNMENT_REMOVED',
        priority: 'LOW',
        metadata: {
            projectId,
            projectTitle,
            reason,
            actionUrl: `/projects/${projectId}`,
        },
    });
}

export async function notifySystemAnnouncement({
    recipientId,
    message,
    actionUrl,
}: {
    recipientId: string;
    message: string;
    actionUrl?: string;
}) {
    return createNotification({
        recipientId,
        type: 'SYSTEM_ANNOUNCEMENT',
        priority: 'MEDIUM',
        metadata: {
            reason: message,
            actionUrl,
        },
    });
}

// Social Action Notifications

export async function notifyLike({
    recipientId,
    senderId,
    senderName,
    targetType,
    targetId,
    targetTitle,
}: {
    recipientId: string;
    senderId: string;
    senderName: string;
    targetType: 'project' | 'post' | 'comment';
    targetId: string;
    targetTitle?: string;
}) {
    // Don't notify if user likes their own content
    if (recipientId === senderId) return null;

    return createNotification({
        recipientId,
        senderId,
        type: 'LIKE',
        priority: 'LOW',
        metadata: {
            targetType,
            targetId,
            targetTitle,
            senderName,
            actionUrl: targetType === 'project' ? `/projects/${targetId}` : `/posts/${targetId}`,
        },
    });
}

export async function notifyComment({
    recipientId,
    senderId,
    senderName,
    targetType,
    targetId,
    targetTitle,
    commentText,
}: {
    recipientId: string;
    senderId: string;
    senderName: string;
    targetType: 'project' | 'post';
    targetId: string;
    targetTitle?: string;
    commentText?: string;
}) {
    // Don't notify if user comments on their own content
    if (recipientId === senderId) return null;

    return createNotification({
        recipientId,
        senderId,
        type: 'COMMENT',
        priority: 'MEDIUM',
        metadata: {
            targetType,
            targetId,
            targetTitle,
            senderName,
            commentText: commentText?.substring(0, 100), // Truncate long comments
            actionUrl: targetType === 'project' ? `/projects/${targetId}` : `/posts/${targetId}`,
        },
    });
}

export async function notifyFollow({
    recipientId,
    senderId,
    senderName,
}: {
    recipientId: string;
    senderId: string;
    senderName: string;
}) {
    // Don't notify if user follows themselves
    if (recipientId === senderId) return null;

    return createNotification({
        recipientId,
        senderId,
        type: 'FOLLOW',
        priority: 'LOW',
        metadata: {
            senderName,
            actionUrl: `/profile/${senderId}`,
        },
    });
}

export async function notifyMention({
    recipientId,
    senderId,
    senderName,
    targetType,
    targetId,
    targetTitle,
    mentionContext,
}: {
    recipientId: string;
    senderId: string;
    senderName: string;
    targetType: 'project' | 'post' | 'comment';
    targetId: string;
    targetTitle?: string;
    mentionContext?: string;
}) {
    return createNotification({
        recipientId,
        senderId,
        type: 'MENTION',
        priority: 'MEDIUM',
        metadata: {
            targetType,
            targetId,
            targetTitle,
            senderName,
            mentionContext: mentionContext?.substring(0, 100),
            actionUrl: targetType === 'project' ? `/projects/${targetId}` : `/posts/${targetId}`,
        },
    });
}
