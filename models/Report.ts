import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReport extends Document {
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserId: string;
  targetType: 'user' | 'project' | 'comment' | 'chat';
  targetId: string;
  targetDetails: {
    title?: string;
    description?: string;
    authorName?: string;
    content?: string;
  };
  reason: 'spam' | 'inappropriate_content' | 'harassment' | 'copyright_violation' | 'fake_account' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string; // Admin ID who is handling the report
  handledBy?: string; // Admin ID who handled the report
  resolutionNotes?: string;
  resolvedBy?: string; // Admin ID who resolved the report
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

const reportSchema = new Schema<IReport>({
  reporterId: { type: String, required: true, index: true },
  reporterName: { type: String, required: true },
  reporterEmail: { type: String, required: true },
  reportedUserId: { type: String, required: true, index: true },
  targetType: { 
    type: String, 
    enum: ['user', 'project', 'comment', 'chat'], 
    required: true,
    index: true
  },
  targetId: { type: String, required: true, index: true },
  targetDetails: {
    title: { type: String },
    description: { type: String },
    authorName: { type: String },
    content: { type: String }
  },
  reason: { 
    type: String, 
    enum: ['spam', 'inappropriate_content', 'harassment', 'copyright_violation', 'fake_account', 'other'], 
    required: true 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'closed'], 
    default: 'pending',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium',
    index: true
  },
  assignedTo: { type: String, index: true },
  handledBy: { type: String, index: true },
  resolutionNotes: { type: String },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Indexes for better query performance
reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ assignedTo: 1, status: 1 });

const Report = (global as any).Report || mongoose.model<IReport>('Report', reportSchema);

if (process.env.NODE_ENV === 'development') {
  (global as any).Report = Report;
}

// Helper functions
export const createReport = async (reportData: Omit<IReport, keyof Document>) => {
  const report = new Report(reportData);
  return report.save();
};

export const getReports = async (filters: {
  status?: string;
  targetType?: string;
  priority?: string;
  assignedTo?: string;
  reporterId?: string;
  targetId?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  const {
    status,
    targetType,
    priority,
    assignedTo,
    reporterId,
    targetId,
    limit = 20,
    page = 1,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const query: any = {};
  
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (reporterId) query.reporterId = reporterId;
  if (targetId) query.targetId = targetId;

  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return Report.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();
};

export const getReportsCount = async (filters: {
  status?: string;
  targetType?: string;
  priority?: string;
  assignedTo?: string;
  reporterId?: string;
  targetId?: string;
} = {}) => {
  const {
    status,
    targetType,
    priority,
    assignedTo,
    reporterId,
    targetId
  } = filters;

  const query: any = {};
  
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (reporterId) query.reporterId = reporterId;
  if (targetId) query.targetId = targetId;

  return Report.countDocuments(query).exec();
};

export const updateReportStatus = async (
  reportId: string,
  status: 'pending' | 'reviewed' | 'closed',
  adminId: string,
  resolutionNotes?: string
) => {
  const updateData: any = { status };
  
  if (status === 'closed') {
    updateData.resolvedBy = adminId;
    updateData.resolvedAt = new Date();
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
  }
  
  if (status === 'reviewed') {
    updateData.handledBy = adminId;
  }

  return Report.findByIdAndUpdate(
    reportId,
    updateData,
    { new: true }
  ).exec();
};

export const getReportStats = async () => {
  const stats = await Report.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const priorityStats = await Report.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  const targetTypeStats = await Report.aggregate([
    {
      $group: {
        _id: '$targetType',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    byStatus: stats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byPriority: priorityStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byTargetType: targetTypeStats.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

export default Report;
