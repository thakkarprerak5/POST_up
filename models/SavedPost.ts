import mongoose, { Schema, Document } from 'mongoose';

// SavedPost interface
interface ISavedPost extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  savedAt: Date;
}

// SavedPost schema
const SavedPostSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate saves
SavedPostSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Export model
export const SavedPost = mongoose.models.SavedPost || mongoose.model<ISavedPost>('SavedPost', SavedPostSchema);

export type { ISavedPost };
