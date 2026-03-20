import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  tags: string[];
  images?: string[];
  proposalFile?: string;
  githubUrl?: string;
  liveUrl?: string;
  visibility?: 'public' | 'private';
  author: {
    type: mongoose.Schema.Types.ObjectId;
    ref: 'User';
    required: true;
  };
  likes: string[]; // array of user IDs who liked
  likeCount: number;
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: Date;
  }>;
  shares: string[]; // array of user IDs who shared
  shareCount: number;
  createdAt: Date;
  // Soft delete fields
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  restoreAvailableUntil?: Date;
  // New fields for enhanced project management
  registrationType: 'individual' | 'group';
  // Enhanced group structure
  group?: {
    lead: {
      id: string;
      name: string;
      email: string;
    };
    members: Array<{
      userId?: string; // For registered users
      email: string; // Always present
      status: 'active' | 'pending'; // pending = not registered yet
      name?: string; // For registered users
    }>;
  };
  // Legacy fields (kept for backward compatibility)
  groupLead?: {
    id: string;
    name: string;
    email: string;
  };
  membersCount?: number;
  members?: Array<{
    fullName?: string;
    email?: string;
    role?: string;
  }>;
  // NEW LIFECYCLE FIELDS
  mentorId?: string | null; // Assigned mentor ID
  projectStatus: 'PENDING' | 'ACTIVE' | 'ARCHIVED'; // NEW STATUS VALUES
  mentorStatus: 'invited' | 'accepted' | 'rejected' | 'not_assigned';
  proposalSource: 'mentor_invitation' | 'direct_registration';
  mentorInvitation?: {
    mentorName: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp?: string;
  };
  // Trending fields
  views: number;
  invitations: number; // Count of mentor invitations sent
  trendingScore: number; // Calculated: (invitations * 5) + (likes * 2) + (views * 0.5)
  authorId?: string; // String copy of author ObjectId for simple string-based queries
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: [String], default: [] },
  images: { type: [String], default: [] },
  proposalFile: { type: String },
  githubUrl: { type: String },
  liveUrl: { type: String },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: { type: [String], default: [] },
  likeCount: { type: Number, default: 0 },
  comments: [{
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  shares: { type: [String], default: [] },
  shareCount: { type: Number, default: 0 },
  // Soft delete fields
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  restoreAvailableUntil: { type: Date },
  // New fields for enhanced project management
  registrationType: { type: String, enum: ['individual', 'group'], required: true },
  // Enhanced group structure - only required for group projects
  group: {
    lead: {
      id: { type: String, required: false },
      name: { type: String, required: false },
      email: { type: String, required: false }
    },
    members: [{
      userId: { type: String }, // For registered users
      email: { type: String, required: false }, // Always present
      status: { type: String, enum: ['active', 'pending'], default: 'pending' }, // pending = not registered yet
      name: { type: String } // For registered users
    }]
  },
  // Legacy fields (kept for backward compatibility)
  groupLead: {
    id: { type: String },
    name: { type: String },
    email: { type: String }
  },
  membersCount: { type: Number },
  members: [{
    fullName: { type: String },
    email: { type: String },
    role: { type: String }
  }],
  mentorStatus: { type: String, enum: ['invited', 'accepted', 'rejected', 'not_assigned'], default: 'not_assigned' },
  // NEW LIFECYCLE FIELDS
  mentorId: { type: String, default: null }, // Assigned mentor ID
  projectStatus: { type: String, enum: ['PENDING', 'ACTIVE', 'ARCHIVED'], default: 'PENDING' }, // NEW STATUS VALUES
  proposalSource: {
    type: String,
    enum: ['mentor_invitation', 'direct_registration'],
    default: 'direct_registration'
  },
  mentorInvitation: {
    mentorName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    timestamp: { type: String }
  },
  // Trending fields
  views: { type: Number, default: 0, index: true },
  invitations: { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0, index: true },
  // String copy of the author ObjectId for simple string-based lookups
  authorId: { type: String, index: true },
}, { timestamps: true });

const Project = (global as any).Project || mongoose.model<IProject>('Project', ProjectSchema);

if (process.env.NODE_ENV === 'development') {
  (global as any).Project = Project;
}

// Helper function to calculate trending score
export const calculateTrendingScore = (project: IProject | any): number => {
  const invitations = project.invitations || 0;
  const likes = project.likeCount || 0;
  const views = project.views || 0;

  // Formula: (invitations * 5) + (likes * 2) + (views * 0.5)
  return (invitations * 5) + (likes * 2) + (views * 0.5);
};

// Helper function to update trending score for a project
export const updateTrendingScore = async (projectId: string) => {
  const project = await Project.findById(projectId);
  if (project) {
    project.trendingScore = calculateTrendingScore(project);
    await project.save();
    return project;
  }
  return null;
};

export const createProject = async (data: Omit<IProject, keyof Document>) => {
  const project = new Project(data);
  return project.save();
};

export const listProjects = async (query: any = {}, options: { limit?: number; sort?: any; includeDeleted?: boolean } = {}) => {
  const { limit = 20, sort = { createdAt: -1 }, includeDeleted = false } = options;

  // By default, exclude deleted projects unless explicitly requested
  const finalQuery = includeDeleted ? query : { ...query, isDeleted: { $ne: true } };

  // Populate author data from User collection using author reference
  return Project.find(finalQuery)
    .populate('author', 'name username avatar photo')
    .sort(sort)
    .limit(limit)
    .exec();
};

// Soft delete a project
export const softDeleteProject = async (projectId: string, userId: string) => {
  console.log('🔍 softDeleteProject called with:', {
    projectId,
    userId,
    projectIdType: typeof projectId,
    userIdType: typeof userId
  });

  // Defensive checks
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Invalid project ID provided to softDeleteProject');
  }

  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID provided to softDeleteProject');
  }

  const restoreAvailableUntil = new Date();
  restoreAvailableUntil.setHours(restoreAvailableUntil.getHours() + 24); // 24 hours from now

  try {
    const result = await Project.findByIdAndUpdate(
      projectId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        restoreAvailableUntil: restoreAvailableUntil
      },
      { new: true }
    ).exec();

    console.log('✅ softDeleteProject success:', result?.title || 'Unknown project');
    return result;
  } catch (error: any) {
    console.error('❌ softDeleteProject error:', error);
    throw new Error(`Failed to soft delete project: ${error?.message || 'Unknown error'}`);
  }
};

// Restore a deleted project
export const restoreProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId).exec();

  if (!project) {
    throw new Error('Project not found');
  }

  if (!project.isDeleted) {
    throw new Error('Project is not deleted');
  }

  if (project.deletedBy !== userId) {
    throw new Error('You can only restore your own deleted projects');
  }

  if (project.restoreAvailableUntil && new Date() > project.restoreAvailableUntil) {
    throw new Error('Restore period has expired. Project cannot be restored.');
  }

  return Project.findByIdAndUpdate(
    projectId,
    {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      restoreAvailableUntil: undefined
    },
    { new: true }
  ).exec();
};

// Get deleted projects that can still be restored
export const getDeletedProjects = async (userId: string) => {
  return Project.find({
    isDeleted: true,
    deletedBy: userId,
    restoreAvailableUntil: { $gt: new Date() }
  }).sort({ deletedAt: -1 }).exec();
};

// Permanently delete projects past restore window
export const permanentlyDeleteExpiredProjects = async () => {
  const result = await Project.deleteMany({
    isDeleted: true,
    restoreAvailableUntil: { $lt: new Date() }
  });

  return result.deletedCount;
};

// Define comment interface for better type safety
interface IComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

// Add static method for deleting comments
ProjectSchema.statics.deleteComment = async function (projectId: string, commentId: string, userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`[deleteComment] Starting deletion - Project: ${projectId}, Comment: ${commentId}, User: ${userId}`);

    // First, find the project with the session
    const project = await this.findById(projectId).session(session);
    if (!project) {
      console.error('[deleteComment] Project not found:', projectId);
      throw new Error('Project not found');
    }

    // Find the comment
    const comment = project.comments.find((c: any) =>
      c.id === commentId || c._id?.toString() === commentId
    );

    if (!comment) {
      console.error('[deleteComment] Comment not found:', {
        projectId,
        commentId,
        commentIds: project.comments.map((c: any) => c.id || c._id?.toString())
      });
      throw new Error('Comment not found');
    }

    // Check permissions
    const isCommentAuthor = comment.userId?.toString() === userId;
    const isProjectAuthor = project.author?.id?.toString() === userId;

    if (!isCommentAuthor && !isProjectAuthor) {
      console.error('[deleteComment] Unauthorized deletion attempt:', {
        userId,
        commentAuthorId: comment.userId,
        projectAuthorId: project.author?.id
      });
      throw new Error('Not authorized to delete this comment');
    }

    // Convert commentId to ObjectId if it's a valid ObjectId string
    const commentObjectId = mongoose.Types.ObjectId.isValid(commentId)
      ? new mongoose.Types.ObjectId(commentId)
      : commentId;

    // Try to remove the comment using $pull with proper type handling
    const result = await this.updateOne(
      { _id: projectId },
      {
        $pull: {
          comments: {
            $or: [
              { id: commentId },
              { _id: commentObjectId }
            ]
          }
        }
      },
      { session }
    );

    if (result.modifiedCount === 0) {
      // If still not modified, try with direct array manipulation
      const commentIndex = project.comments.findIndex((c: any) =>
        c.id === commentId || c._id?.toString() === commentId
      );

      if (commentIndex === -1) {
        throw new Error('Comment not found in project');
      }

      project.comments.splice(commentIndex, 1);
      await project.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Get the updated comment count
    const updatedProject = await this.findById(projectId);
    const commentCount = updatedProject?.comments?.length || 0;

    console.log('[deleteComment] Successfully deleted comment:', {
      projectId,
      commentId,
      remainingComments: commentCount
    });

    return {
      success: true,
      commentCount
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('[deleteComment] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      projectId,
      commentId,
      userId
    });

    throw error;
  }
};

// Add the static method to the model
declare module 'mongoose' {
  interface ProjectModel extends mongoose.Model<IProject> {
    deleteComment(projectId: string, commentId: string, userId: string): Promise<{ success: boolean; commentCount: number }>;
  }
}

export default Project;
