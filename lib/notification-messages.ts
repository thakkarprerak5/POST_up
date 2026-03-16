import { NotificationType } from '@/models/Notification';

export interface NotificationMessage {
    title: string;
    body: string;
    icon?: string;
}

/**
 * Get user-friendly notification messages based on type and metadata
 */
export function getNotificationMessage(
    type: NotificationType,
    metadata: any
): NotificationMessage {
    const senderName = metadata.senderName || 'Someone';
    const targetTitle = metadata.targetTitle || 'your content';
    const mentorName = metadata.mentorName || 'A mentor';
    const projectTitle = metadata.projectTitle || 'your project';

    switch (type) {
        // Social Actions
        case 'LIKE':
            return {
                title: 'New Like',
                body: `${senderName} liked ${targetTitle}`,
                icon: '❤️',
            };

        case 'COMMENT':
            return {
                title: 'New Comment',
                body: `${senderName} commented on ${targetTitle}`,
                icon: '💬',
            };

        case 'FOLLOW':
            return {
                title: 'New Follower',
                body: `${senderName} started following you`,
                icon: '👤',
            };

        case 'MENTION':
            return {
                title: 'You were mentioned',
                body: `${senderName} mentioned you in a ${metadata.targetType}`,
                icon: '@',
            };

        // Project Actions
        case 'PROJECT_APPROVED':
            return {
                title: 'Project Approved',
                body: `Your project "${projectTitle}" has been approved`,
                icon: '✅',
            };

        case 'PROJECT_REJECTED':
            return {
                title: 'Project Rejected',
                body: `Your project "${projectTitle}" was rejected${metadata.reason ? `: ${metadata.reason}` : ''}`,
                icon: '❌',
            };

        // Mentor Actions
        case 'MENTOR_ACCEPTED':
            return {
                title: 'Mentor Accepted',
                body: `${mentorName} accepted your request for "${projectTitle}"`,
                icon: '🎓',
            };

        case 'MENTOR_REJECTED':
            return {
                title: 'Mentor Declined',
                body: `${mentorName} declined your request for "${projectTitle}"`,
                icon: '📝',
            };

        // Admin Actions
        case 'ADMIN_WARNING':
            return {
                title: 'Account Warning',
                body: metadata.reason || 'Your account has been flagged. Please contact support.',
                icon: '⚠️',
            };

        case 'ADMIN_BAN':
            return {
                title: 'Account Suspended',
                body: metadata.reason || 'Your account has been suspended.',
                icon: '🚫',
            };

        case 'BAN_WARNING':
            return {
                title: 'CRITICAL WARNING',
                body: metadata.message || 'Meet authorized person within 48 hours to prevent permanent account deletion.',
                icon: '🔴',
            };

        case 'ACCOUNT_RESTORED':
            return {
                title: 'Account Restored',
                body: metadata.message || 'Your account access has been restored.',
                icon: '✅',
            };

        // Report Actions
        case 'REPORT_RESOLVED':
            return {
                title: 'Report Resolved',
                body: metadata.message || 'The content you reported has been reviewed and resolved.',
                icon: '✓',
            };

        // Assignment Actions
        case 'ASSIGNMENT_REMOVED':
            return {
                title: 'Assignment Removed',
                body: `Your assignment for "${projectTitle}" has been removed${metadata.reason ? `: ${metadata.reason}` : ''}`,
                icon: '📋',
            };

        // System
        case 'SYSTEM_ANNOUNCEMENT':
            return {
                title: 'System Announcement',
                body: metadata.reason || metadata.message || 'New announcement',
                icon: '📢',
            };

        default:
            return {
                title: 'New Notification',
                body: 'You have a new notification',
                icon: '🔔',
            };
    }
}

/**
 * Get relative time string (e.g., "2 mins ago", "Just now")
 */
export function getRelativeTime(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffInMs = now.getTime() - then.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return then.toLocaleDateString();
}
