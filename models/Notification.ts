import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
    // Student & Group Triggers
    | 'GROUP_CREATED'
    | 'GROUP_MEMBER_ADDED'
    | 'MENTOR_ACCEPTED'
    | 'MENTOR_REJECTED'
    | 'MENTOR_ASSIGNED'
    | 'PROJECT_APPROVED'
    | 'PROJECT_REJECTED'
    | 'LIKE'
    | 'COMMENT'
    // Mentor Triggers
    | 'MENTOR_INVITATION_RECEIVED'
    | 'STUDENT_ASSIGNED'
    // Super-Admin Triggers
    | 'MENTOR_ACTIVITY_ALERT'
    | 'NEW_REPORT_FILED'
    // Global Triggers
    | 'SYSTEM_ANNOUNCEMENT'
    | 'ADMIN_WARNING'
    | 'ADMIN_BAN'
    | 'BAN_WARNING'
    | 'SOFT_BAN_ISSUED'
    | 'PROPER_BAN_ISSUED'
    | 'ACCOUNT_RESTORED'
    | 'ASSIGNMENT_REMOVED'
    | 'REPORT_RESOLVED'
    // Social
    | 'FOLLOW'
    | 'MENTION';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface INotificationMetadata {
    targetType?: 'project' | 'user' | 'report' | 'assignment';
    targetId?: string;
    targetTitle?: string;
    projectId?: string;
    projectTitle?: string;
    mentorName?: string;
    reason?: string;
    actionUrl?: string;
    [key: string]: any; // Allow additional metadata fields
}

export interface INotification extends Document {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    priority: NotificationPriority;
    isRead: boolean;
    metadata: INotificationMetadata;
    createdAt: Date;
    readAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipientId: {
            type: String,
            required: true,
            ref: 'User',
            index: true,
        },
        senderId: {
            type: String,
            ref: 'User',
            required: false,
        },
        type: {
            type: String,
            enum: [
                'GROUP_CREATED',
                'GROUP_MEMBER_ADDED',
                'MENTOR_ACCEPTED',
                'MENTOR_REJECTED',
                'MENTOR_ASSIGNED',
                'PROJECT_APPROVED',
                'PROJECT_REJECTED',
                'LIKE',
                'COMMENT',
                'MENTOR_INVITATION_RECEIVED',
                'STUDENT_ASSIGNED',
                'MENTOR_ACTIVITY_ALERT',
                'NEW_REPORT_FILED',
                'SYSTEM_ANNOUNCEMENT',
                'ADMIN_WARNING',
                'ADMIN_BAN',
                'BAN_WARNING',
                'SOFT_BAN_ISSUED',
                'PROPER_BAN_ISSUED',
                'ACCOUNT_RESTORED',
                'ASSIGNMENT_REMOVED',
                'REPORT_RESOLVED',
                'FOLLOW',
                'MENTION',
            ],
            required: true,
        },
        priority: {
            type: String,
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        readAt: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, priority: 1, createdAt: -1 });

// Virtual for priority sorting weight
NotificationSchema.virtual('priorityWeight').get(function (this: INotification) {
    const weights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return weights[this.priority];
});

// Ensure virtual fields are included in JSON output
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

// Create model if it doesn't exist
const Notification =
    (global as any).Notification ||
    mongoose.model<INotification>('Notification', NotificationSchema);

// For development
if (process.env.NODE_ENV === 'development') {
    (global as any).Notification = Notification;
}

export default Notification;

// Helper functions
export const createNotificationRecord = async (
    data: Omit<INotification, keyof Document>
) => {
    try {
        console.log('💾 Saving notification to DB:', JSON.stringify(data, null, 2));
        const notification = new Notification(data);
        const saved = await notification.save();
        console.log('✅ Notification saved successfully:', saved._id);
        return saved;
    } catch (error) {
        console.error('❌ DB Save Error in createNotificationRecord:', error);
        throw error;
    }
};

export const getNotificationsByRecipient = async (
    recipientId: string,
    options: {
        isRead?: boolean;
        priority?: NotificationPriority;
        limit?: number;
        skip?: number;
    } = {}
) => {
    const { isRead, priority, limit = 20, skip = 0 } = options;

    const query: any = { recipientId };
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    return Notification.find(query)
        .sort({ priority: -1, createdAt: -1 }) // Sort by priority DESC, then date DESC
        .skip(skip)
        .limit(limit)
        .exec();
};

export const markNotificationAsRead = async (
    notificationId: string,
    recipientId: string
) => {
    const notification = await Notification.findOne({
        _id: notificationId,
        recipientId,
    });

    if (!notification) {
        throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return notification.save();
};

export const markAllAsRead = async (recipientId: string) => {
    return Notification.updateMany(
        { recipientId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
};

export const deleteNotificationById = async (
    notificationId: string,
    recipientId: string
) => {
    const notification = await Notification.findOne({
        _id: notificationId,
        recipientId,
    });

    if (!notification) {
        throw new Error('Notification not found');
    }

    // Prevent deletion of HIGH priority notifications
    if (notification.priority === 'HIGH') {
        throw new Error('HIGH priority notifications cannot be deleted');
    }

    return Notification.findByIdAndDelete(notificationId);
};

export const getUnreadCount = async (recipientId: string) => {
    return Notification.countDocuments({ recipientId, isRead: false });
};

export const hasHighPriorityUnread = async (recipientId: string) => {
    const count = await Notification.countDocuments({
        recipientId,
        isRead: false,
        priority: 'HIGH',
    });
    return count > 0;
};
