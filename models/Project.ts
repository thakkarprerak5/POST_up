import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  tags: string[];
  images?: string[];
  githubUrl?: string;
  liveUrl?: string;
  author: {
    id: string;
    name: string;
    image?: string;
    avatar?: string;
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
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: [String], default: [] },
  images: { type: [String], default: [] },
  githubUrl: { type: String },
  liveUrl: { type: String },
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
    avatar: { type: String },
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
}, { timestamps: true });

const Project = (global as any).Project || mongoose.model<IProject>('Project', ProjectSchema);

if (process.env.NODE_ENV === 'development') {
  (global as any).Project = Project;
}

export const createProject = async (data: Omit<IProject, keyof Document>) => {
  const project = new Project(data);
  return project.save();
};

export const listProjects = async (query: any = {}, options: { limit?: number; sort?: any; includeDeleted?: boolean } = {}) => {
  const { limit = 20, sort = { createdAt: -1 }, includeDeleted = false } = options;
  
  // By default, exclude deleted projects unless explicitly requested
  const finalQuery = includeDeleted ? query : { ...query, isDeleted: { $ne: true } };
  
  return Project.find(finalQuery).sort(sort).limit(limit).exec();
};

// Soft delete a project
export const softDeleteProject = async (projectId: string, userId: string) => {
  const restoreAvailableUntil = new Date();
  restoreAvailableUntil.setHours(restoreAvailableUntil.getHours() + 24); // 24 hours from now
  
  return Project.findByIdAndUpdate(
    projectId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      restoreAvailableUntil: restoreAvailableUntil
    },
    { new: true }
  ).exec();
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
ProjectSchema.statics.deleteComment = async function(projectId: string, commentId: string, userId: string) {
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
