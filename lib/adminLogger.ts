import { connectDB } from './db';
import AdminActivityLog from '@/models/AdminActivityLog';

export interface AdminActionLog {
    adminId: string;
    actionType: 'BAN_USER' | 'RESOLVE_REPORT' | 'REJECT_REPORT' | 'DELETE_CONTENT' | 'UPDATE_USER' | 'DELETE_USER' | 'ASSIGN_ROLE' | 'ESCALATE_REPORT' | 'CREATE_ADMIN';
    targetId: string;
    targetType?: 'user' | 'report' | 'project' | 'post' | 'comment';
    details?: string;
    metadata?: Record<string, any>;
}

/**
 * Log admin actions for audit trail and compliance
 */
export async function logAdminAction(data: AdminActionLog): Promise<void> {
    try {
        await connectDB();

        const log = new AdminActivityLog({
            adminId: data.adminId,
            actionType: data.actionType,
            targetId: data.targetId,
            targetType: data.targetType,
            details: data.details || '',
            metadata: data.metadata || {},
            timestamp: new Date(),
            ipAddress: '', // Can be populated from request headers if needed
            userAgent: ''  // Can be populated from request headers if needed
        });

        await log.save();
        console.log('✅ Admin action logged:', data.actionType);
    } catch (error) {
        // Don't throw - logging failure shouldn't break the main operation
        console.error('❌ Failed to log admin action:', error);
    }
}

/**
 * Get recent admin activity logs with pagination
 */
export async function getAdminActivityLogs(options: {
    limit?: number;
    skip?: number;
    adminId?: string;
    actionType?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    try {
        await connectDB();

        const query: any = {};

        if (options.adminId) {
            query.adminId = options.adminId;
        }

        if (options.actionType) {
            query.actionType = options.actionType;
        }

        if (options.startDate || options.endDate) {
            query.timestamp = {};
            if (options.startDate) query.timestamp.$gte = options.startDate;
            if (options.endDate) query.timestamp.$lte = options.endDate;
        }

        const logs = await AdminActivityLog.find(query)
            .populate('adminId', 'fullName email type')
            .sort({ timestamp: -1 })
            .limit(options.limit || 50)
            .skip(options.skip || 0)
            .lean();

        const total = await AdminActivityLog.countDocuments(query);

        return {
            logs,
            total,
            hasMore: total > (options.skip || 0) + (options.limit || 50)
        };
    } catch (error) {
        console.error('❌ Failed to fetch admin activity logs:', error);
        return { logs: [], total: 0, hasMore: false };
    }
}
