import { connectDB } from '@/lib/db';
import Notification, {
    createNotificationRecord,
    NotificationType,
    NotificationPriority,
    INotificationMetadata
} from '@/models/Notification';
import { getAllGroupMemberIds } from '@/models/Group';
import User from '@/models/User';

/**
 * Centralized Notification Service
 * 
 * CRITICAL RULES:
 * 1. ALL notifications MUST go through this service
 * 2. NEVER push to User.notifications array (it doesn't exist)
 * 3. ALWAYS use the Notification collection
 * 4. Group notifications MUST notify ALL members including the lead
 */

export interface NotificationPayload {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    priority: NotificationPriority;
    metadata: INotificationMetadata;
}

export interface GroupNotificationPayload {
    groupId: string;
    senderId?: string;
    type: NotificationType;
    priority: NotificationPriority;
    metadata: INotificationMetadata;
}

/**
 * Send a notification to a single user
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
    try {
        await connectDB();

        console.log('📧 NotificationService: Sending notification', {
            type: payload.type,
            recipientId: payload.recipientId,
            priority: payload.priority
        });

        // Validate recipient exists
        const recipient = await User.findById(payload.recipientId).select('_id').exec();
        if (!recipient) {
            console.error('❌ NotificationService: Recipient not found:', payload.recipientId);
            throw new Error(`Recipient ${payload.recipientId} not found`);
        }

        await createNotificationRecord({
            recipientId: payload.recipientId,
            senderId: payload.senderId,
            type: payload.type,
            priority: payload.priority,
            isRead: false,
            metadata: payload.metadata,
            createdAt: new Date()
        } as any);

        console.log('✅ NotificationService: Notification sent successfully');
    } catch (error) {
        console.error('❌ NotificationService: Failed to send notification:', error);
        // Don't throw - notifications should never break the main flow
    }
}

/**
 * Send notifications to multiple users in bulk
 */
export async function sendBulkNotifications(
    recipientIds: string[],
    senderId: string | undefined,
    type: NotificationType,
    priority: NotificationPriority,
    metadata: INotificationMetadata
): Promise<void> {
    try {
        await connectDB();

        console.log('📧 NotificationService: Sending bulk notifications', {
            type,
            recipientCount: recipientIds.length,
            priority
        });

        // Filter out invalid IDs and deduplicate
        const uniqueRecipientIds = Array.from(new Set(recipientIds.filter(id => id && id.trim())));

        if (uniqueRecipientIds.length === 0) {
            console.warn('⚠️ NotificationService: No valid recipients for bulk notification');
            return;
        }

        // Create notification documents for all recipients
        const notifications = uniqueRecipientIds.map(recipientId => ({
            recipientId,
            senderId,
            type,
            priority,
            isRead: false,
            metadata,
            createdAt: new Date()
        }));

        // Use insertMany for better performance
        await Notification.insertMany(notifications);

        console.log(`✅ NotificationService: ${notifications.length} bulk notifications sent successfully`);
    } catch (error) {
        console.error('❌ NotificationService: Failed to send bulk notifications:', error);
        // Don't throw - notifications should never break the main flow
    }
}

/**
 * Send notification to ALL members of a group
 * 
 * CRITICAL: This function dynamically extracts:
 * - Group lead
 * - All members from the members array
 * - All studentIds from the studentIds array
 * 
 * It ensures EVERY student in the group receives the notification
 */
export async function sendGroupNotification(payload: GroupNotificationPayload): Promise<void> {
    try {
        await connectDB();

        console.log('👥 NotificationService: Sending group notification', {
            type: payload.type,
            groupId: payload.groupId,
            priority: payload.priority
        });

        // Get ALL member IDs from the group (includes lead, members, and studentIds)
        const memberIds = await getAllGroupMemberIds(payload.groupId);

        if (memberIds.length === 0) {
            console.warn('⚠️ NotificationService: No members found in group:', payload.groupId);
            return;
        }

        console.log(`📊 NotificationService: Found ${memberIds.length} group members to notify`);

        // Send to all members using bulk notification
        await sendBulkNotifications(
            memberIds,
            payload.senderId,
            payload.type,
            payload.priority,
            payload.metadata
        );

        console.log('✅ NotificationService: Group notification sent successfully');
    } catch (error) {
        console.error('❌ NotificationService: Failed to send group notification:', error);
        // Don't throw - notifications should never break the main flow
    }
}

/**
 * Helper: Send notification when a mentor accepts/rejects a project
 * Handles both individual and group projects
 */
export async function notifyMentorResponse(
    projectId: string,
    projectTitle: string,
    mentorId: string,
    mentorName: string,
    decision: 'accepted' | 'rejected',
    isGroupProject: boolean,
    groupId?: string,
    studentId?: string,
    reason?: string
): Promise<void> {
    const type: NotificationType = decision === 'accepted' ? 'MENTOR_ACCEPTED' : 'MENTOR_REJECTED';
    const priority: NotificationPriority = decision === 'accepted' ? 'HIGH' : 'MEDIUM';

    const metadata: INotificationMetadata = {
        projectId,
        projectTitle,
        mentorName,
        reason,
        actionUrl: `/projects/${projectId}`,
        targetType: 'project',
        targetId: projectId
    };

    if (isGroupProject && groupId) {
        // Notify ALL group members
        await sendGroupNotification({
            groupId,
            senderId: mentorId,
            type,
            priority,
            metadata
        });
    } else if (studentId) {
        // Notify individual student
        await sendNotification({
            recipientId: studentId,
            senderId: mentorId,
            type,
            priority,
            metadata
        });
    }
}

/**
 * Helper: Notify when admin assigns a mentor
 */
export async function notifyMentorAssignment(
    mentorId: string,
    mentorName: string,
    assignedBy: string,
    projectId: string,
    projectTitle: string,
    isGroupProject: boolean,
    groupId?: string,
    studentId?: string
): Promise<void> {
    const metadata: INotificationMetadata = {
        projectId,
        projectTitle,
        mentorName,
        actionUrl: `/projects/${projectId}`,
        targetType: 'assignment',
        targetId: mentorId
    };

    if (isGroupProject && groupId) {
        await sendGroupNotification({
            groupId,
            senderId: assignedBy,
            type: 'MENTOR_ASSIGNED',
            priority: 'HIGH',
            metadata
        });
    } else if (studentId) {
        await sendNotification({
            recipientId: studentId,
            senderId: assignedBy,
            type: 'MENTOR_ASSIGNED',
            priority: 'HIGH',
            metadata: {
                ...metadata,
                targetId: projectId
            }
        });
    }
}

/**
 * Helper to notify about assignment removal
 */
export async function notifyAssignmentRemoved(payload: {
    recipientId: string;
    projectId: string;
    projectTitle: string;
    reason: string;
    isGroup?: boolean;
    groupId?: string;
}): Promise<void> {  // Explicitly return Promise<void>
    try {
        const { recipientId, projectId, projectTitle, reason, isGroup, groupId } = payload;

        // If it's a group assignment removal, notify all members
        if (isGroup && groupId) {
            await sendGroupNotification({
                groupId,
                senderId: 'SYSTEM', // System notification or could be mentor ID if passed
                type: 'ASSIGNMENT_REMOVED',
                priority: 'HIGH',
                metadata: {
                    projectId,
                    projectTitle,
                    reason,
                    message: `Assignment for "${projectTitle}" was removed: ${reason}`,
                    targetType: 'project',
                    targetId: projectId
                }
            });
        } else {
            // Notify individual student
            await sendNotification({
                recipientId,
                senderId: 'SYSTEM',
                type: 'ASSIGNMENT_REMOVED',
                priority: 'HIGH',
                metadata: {
                    projectId,
                    projectTitle,
                    reason,
                    message: `Your assignment for "${projectTitle}" was removed: ${reason}`,
                    targetType: 'project',
                    targetId: projectId
                }
            });
        }
    } catch (error) {
        console.error('❌ NotificationService: Failed to send assignment removal notification:', error);
    }
}

/**
 * Helper: Notify when a group is created
 */
export async function notifyGroupCreation(
    groupId: string,
    groupName: string,
    leadId: string
): Promise<void> {
    await sendGroupNotification({
        groupId,
        senderId: leadId,
        type: 'GROUP_CREATED',
        priority: 'MEDIUM',
        metadata: {
            targetType: 'project',
            targetTitle: groupName,
            actionUrl: `/groups/${groupId}`
        }
    });
}

/**
 * Helper: Notify when someone likes a post/project
 */
export async function notifyLike(
    authorId: string,
    likerId: string,
    likerName: string,
    targetType: 'project' | 'post',
    targetId: string,
    targetTitle: string
): Promise<void> {
    // Don't notify if user likes their own content
    if (authorId === likerId) return;

    await sendNotification({
        recipientId: authorId,
        senderId: likerId,
        type: 'LIKE',
        priority: 'LOW',
        metadata: {
            targetType,
            targetId,
            targetTitle,
            actionUrl: `/${targetType}s/${targetId}`
        }
    });
}

/**
 * Helper: Notify when someone comments
 */
export async function notifyComment(
    authorId: string,
    commenterId: string,
    commenterName: string,
    targetType: 'project' | 'post',
    targetId: string,
    targetTitle: string,
    commentText: string
): Promise<void> {
    // Don't notify if user comments on their own content
    if (authorId === commenterId) return;

    await sendNotification({
        recipientId: authorId,
        senderId: commenterId,
        type: 'COMMENT',
        priority: 'MEDIUM',
        metadata: {
            targetType,
            targetId,
            targetTitle,
            reason: commentText.substring(0, 100), // Preview
            actionUrl: `/${targetType}s/${targetId}`
        }
    });
}

/**
 * Helper: Notify mentor when they receive an invitation
 */
export async function notifyMentorInvitation(
    mentorId: string,
    studentId: string,
    studentName: string,
    projectId: string,
    projectTitle: string,
    invitationId: string
): Promise<void> {
    await sendNotification({
        recipientId: mentorId,
        senderId: studentId,
        type: 'MENTOR_INVITATION_RECEIVED',
        priority: 'HIGH',
        metadata: {
            projectId,
            projectTitle,
            targetType: 'project',
            targetId: invitationId,
            actionUrl: `/mentor/invitations/${invitationId}`
        }
    });
}

/**
 * Helper: Notify super-admin when a report is filed
 */
export async function notifySuperAdminsOfReport(
    reportId: string,
    reporterId: string,
    reporterName: string,
    targetType: string,
    targetId: string
): Promise<void> {
    try {
        await connectDB();

        // Get all super-admins
        const superAdmins = await User.find({ type: 'super-admin' }).select('_id').exec();

        if (superAdmins.length === 0) {
            console.warn('⚠️ No super-admins found to notify about report');
            return;
        }

        const superAdminIds = superAdmins.map(admin => admin._id.toString());

        await sendBulkNotifications(
            superAdminIds,
            reporterId,
            'NEW_REPORT_FILED',
            'HIGH',
            {
                targetType: 'report',
                targetId: reportId,
                reason: `New report filed by ${reporterName}`,
                actionUrl: `/admin/reports/${reportId}`
            }
        );
    } catch (error) {
        console.error('❌ Failed to notify super-admins of report:', error);
    }
}

/**
 * Helper: Notify super-admins when a mentor accepts/rejects
 */
export async function notifySuperAdminsOfMentorActivity(
    mentorId: string,
    mentorName: string,
    studentId: string,
    studentName: string,
    action: 'accepted' | 'rejected',
    projectId: string,
    projectTitle: string
): Promise<void> {
    try {
        await connectDB();

        const superAdmins = await User.find({ type: 'super-admin' }).select('_id').exec();

        if (superAdmins.length === 0) return;

        const superAdminIds = superAdmins.map(admin => admin._id.toString());

        await sendBulkNotifications(
            superAdminIds,
            mentorId,
            'MENTOR_ACTIVITY_ALERT',
            'LOW',
            {
                projectId,
                projectTitle,
                mentorName,
                reason: `${mentorName} ${action} ${studentName}'s project "${projectTitle}"`,
                actionUrl: `/projects/${projectId}`,
                targetType: 'project',
                targetId: projectId
            }
        );
    } catch (error) {
        console.error('❌ Failed to notify super-admins of mentor activity:', error);
    }
}
