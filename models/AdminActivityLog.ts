import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAdminActivityLog extends Document {
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'restore' | 'block' | 'unblock' | 'role_change' | 'system_setting';
  targetType: 'user' | 'project' | 'comment' | 'report' | 'system';
  targetId: string;
  targetName?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

const adminActivityLogSchema = new Schema<IAdminActivityLog>({
  adminId: { type: String, required: true, index: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  action: { type: String, required: true },
  actionType: { 
    type: String, 
    enum: ['create', 'update', 'delete', 'restore', 'block', 'unblock', 'role_change', 'system_setting'], 
    required: true 
  },
  targetType: { 
    type: String, 
    enum: ['user', 'project', 'comment', 'report', 'system'], 
    required: true 
  },
  targetId: { type: String, required: true, index: true },
  targetName: { type: String },
  description: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Indexes for better query performance
adminActivityLogSchema.index({ adminId: 1, timestamp: -1 });
adminActivityLogSchema.index({ targetType: 1, targetId: 1 });
adminActivityLogSchema.index({ actionType: 1, timestamp: -1 });

const AdminActivityLog = (global as any).AdminActivityLog || mongoose.model<IAdminActivityLog>('AdminActivityLog', adminActivityLogSchema);

if (process.env.NODE_ENV === 'development') {
  (global as any).AdminActivityLog = AdminActivityLog;
}

// Helper functions
export const createActivityLog = async (logData: Omit<IAdminActivityLog, keyof Document>) => {
  const log = new AdminActivityLog(logData);
  return log.save();
};

export const getActivityLogs = async (filters: {
  adminId?: string;
  actionType?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  page?: number;
} = {}) => {
  const {
    adminId,
    actionType,
    targetType,
    startDate,
    endDate,
    limit = 50,
    page = 1
  } = filters;

  const query: any = {};
  
  if (adminId) query.adminId = adminId;
  if (actionType) query.actionType = actionType;
  if (targetType) query.targetType = targetType;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  const skip = (page - 1) * limit;
  
  return AdminActivityLog.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

export const getActivityLogsCount = async (filters: {
  adminId?: string;
  actionType?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) => {
  const {
    adminId,
    actionType,
    targetType,
    startDate,
    endDate
  } = filters;

  const query: any = {};
  
  if (adminId) query.adminId = adminId;
  if (actionType) query.actionType = actionType;
  if (targetType) query.targetType = targetType;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return AdminActivityLog.countDocuments(query).exec();
};

export default AdminActivityLog;
