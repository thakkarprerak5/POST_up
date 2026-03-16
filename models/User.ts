// models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IProfile {
  type: 'student' | 'mentor';
  joinedDate: Date;
  bio?: string;
  bannerImage?: string;
  bannerColor?: string;
  enrollmentNo?: string;
  course?: string;
  branch?: string;
  year?: number;
  skills?: string[];
  department?: string;
  expertise?: string[];
  position?: string;
  experience?: number;
  researchAreas?: string[];
  achievements?: string[];
  officeHours?: string;
  isGroupLead?: boolean; // Add group lead status
  groupLeadRequests?: Array<{
    id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    userId?: string;
  }>;
  projectsSupervised?: Array<{
    id: number;
    title: string;
    image: string;
    studentName: string;
  }>;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  projects?: Array<{
    id: string;
    title: string;
    description?: string;
    image?: string;
    url?: string;
  }>;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  photoUrl?: string;
  photo?: string; // Keep for backward compatibility/component mapping
  hasPhoto: boolean;
  type: 'student' | 'mentor' | 'admin' | 'super-admin';
  isEmailVerified: boolean;
  followers: string[];
  following: string[];
  followerCount: number;
  followingCount: number;
  isActive: boolean;
  isBlocked: boolean;
  // Ban enforcement fields
  account_status: 'ACTIVE' | 'SOFT_BANNED' | 'PROPER_BANNED';
  ban_timestamp?: Date;
  banReason?: string;
  bannedBy?: string;
  // Mentor assignment fields
  groupId?: string; // For students - which group they belong to
  directMentorId?: string; // For students - directly assigned mentor
  // Password reset fields (OTP-based)
  resetOtp?: string;
  otpExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define profile schema
const profileSchema = new Schema<IProfile>({
  type: { type: String, enum: ['student', 'mentor'], required: true },
  joinedDate: { type: Date, default: Date.now },
  bio: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  bannerColor: { type: String, default: '' },
  enrollmentNo: { type: String, default: '' },
  course: { type: String, default: '' },
  branch: { type: String, default: '' },
  year: { type: Number, default: 1 },
  skills: { type: [String], default: [] },
  department: { type: String, default: '' },
  expertise: { type: [String], default: [] },
  position: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  researchAreas: { type: [String], default: [] },
  achievements: { type: [String], default: [] },
  officeHours: { type: String, default: 'To be scheduled' },
  isGroupLead: { type: Boolean, default: false }, // Add group lead status field
  groupLeadRequests: [{
    id: { type: String },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    userId: { type: String }
  }],
  projectsSupervised: [{
    id: { type: Number },
    title: { type: String },
    image: { type: String },
    studentName: { type: String }
  }],
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
  projects: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    image: { type: String },
    url: { type: String }
  }]
}, { _id: false });

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String, default: '/placeholder-user.jpg' },
  type: { type: String, enum: ['student', 'mentor', 'admin', 'super-admin'], required: true },
  profile: { type: profileSchema, required: true },
  followers: { type: [String], default: [] }, // Array of user IDs who follow this user
  following: { type: [String], default: [] }, // Array of user IDs this user follows
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  // Ban enforcement fields
  account_status: {
    type: String,
    enum: ['ACTIVE', 'SOFT_BANNED', 'PROPER_BANNED'],
    default: 'ACTIVE',
    index: true
  },
  ban_timestamp: { type: Date, default: null },
  banReason: { type: String, default: null },
  bannedBy: { type: String, ref: 'User', default: null },
  // Mentor assignment fields
  groupId: { type: String, ref: 'Group', default: null }, // For students - which group they belong to
  directMentorId: { type: String, ref: 'User', default: null }, // For students - directly assigned mentor
  // Password reset fields (OTP-based)
  resetOtp: { type: String, default: null, select: false },
  otpExpires: { type: Date, default: null, select: false }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add virtual id field for compatibility - CRASH-PROOF VERSION
userSchema.virtual('id').get(function (this: IUser) {
  // Guard against undefined 'this' context
  if (!this) {
    console.warn('⚠️ Virtual ID: this context is undefined');
    return 'context-undefined';
  }

  // Guard against missing _id
  if (!this._id) {
    console.warn('⚠️ Virtual ID: _id is missing on document');
    return 'id-missing';
  }

  // Safe toString conversion
  try {
    if (typeof this._id.toString === 'function') {
      return this._id.toString();
    }
    // Fallback to String() constructor
    return String(this._id);
  } catch (error) {
    console.error('❌ Virtual ID conversion error:', error);
    return 'conversion-error';
  }
});

// Ensure virtual fields are included in JSON output - CRASH-PROOF VERSION
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    // Safe ID conversion with fallbacks
    if (ret._id) {
      try {
        ret.id = typeof ret._id.toString === 'function'
          ? ret._id.toString()
          : String(ret._id);
      } catch (error) {
        console.error('❌ toJSON transform error:', error);
        ret.id = 'transform-error';
      }
    } else {
      ret.id = 'no-id';
    }
    return ret;
  }
});

// Also set toObject to include virtuals for .lean() and .toObject() calls
userSchema.set('toObject', {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    if (ret._id) {
      try {
        ret.id = typeof ret._id.toString === 'function'
          ? ret._id.toString()
          : String(ret._id);
      } catch (error) {
        console.error('❌ toObject transform error:', error);
        ret.id = 'transform-error';
      }
    } else {
      ret.id = 'no-id';
    }
    return ret;
  }
});

// Create model if it doesn't exist
const User = (global as any).User || mongoose.model<IUser>('User', userSchema, 'users');

// For development
if (process.env.NODE_ENV === 'development') {
  (global as any).User = User;
}

// Helper functions
export const createUser = async (userData: Omit<IUser, keyof Document>) => {
  const user = new User(userData);
  return user.save();
};

export const findUserByEmail = async (email: string) => {
  return User.findOne({ email }).exec();
};

export const findUserById = async (id: string) => {
  console.log('🔍 User Model: findUserById called with:', id);
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('🔍 User Model: Mongoose not connected, state:', mongoose.connection.readyState);
    }

    const result = await User.findById(id).exec();
    console.log('🔍 User Model: findUserById result:', result ? {
      _id: result._id?.toString(),
      fullName: result.fullName,
      email: result.email,
      type: result.type
    } : null);
    return result;
  } catch (error) {
    console.error('🔍 User Model: findUserById error:', error);
    return null;
  }
};

export const updateUserProfile = async (
  id: string,
  updateData: Partial<IProfile> & { username?: string }
) => {
  const set: Record<string, any> = {};

  if (updateData.bio !== undefined) set['profile.bio'] = updateData.bio;
  if ((updateData as any).bannerImage !== undefined) set['profile.bannerImage'] = (updateData as any).bannerImage;
  if ((updateData as any).bannerColor !== undefined) set['profile.bannerColor'] = (updateData as any).bannerColor;
  if (updateData.enrollmentNo !== undefined) set['profile.enrollmentNo'] = updateData.enrollmentNo;
  if (updateData.course !== undefined) set['profile.course'] = updateData.course;
  if (updateData.branch !== undefined) set['profile.branch'] = updateData.branch;
  if (updateData.year !== undefined) set['profile.year'] = updateData.year;
  if (updateData.skills !== undefined) set['profile.skills'] = updateData.skills;
  if (updateData.department !== undefined) set['profile.department'] = updateData.department;
  if (updateData.expertise !== undefined) set['profile.expertise'] = updateData.expertise;
  if (updateData.position !== undefined) set['profile.position'] = updateData.position;
  if (updateData.experience !== undefined) set['profile.experience'] = updateData.experience;
  if (updateData.researchAreas !== undefined) set['profile.researchAreas'] = updateData.researchAreas;
  if (updateData.achievements !== undefined) set['profile.achievements'] = updateData.achievements;
  if (updateData.officeHours !== undefined) set['profile.officeHours'] = updateData.officeHours;
  if ((updateData as any).socialLinks !== undefined) set['profile.socialLinks'] = (updateData as any).socialLinks;
  if ((updateData as any).projects !== undefined) set['profile.projects'] = (updateData as any).projects;

  if (updateData.username !== undefined) set['fullName'] = updateData.username;

  return User.findByIdAndUpdate(id, { $set: set }, { new: true }).exec();
};

// Ban enforcement helper functions
export const softBanUser = async (userId: string, reason: string, adminId: string) => {
  return User.findByIdAndUpdate(
    userId,
    {
      account_status: 'SOFT_BANNED',
      isBlocked: true,
      banReason: reason,
      bannedBy: adminId
    },
    { new: true }
  ).exec();
};

export const properBanUser = async (userId: string, reason: string, adminId: string) => {
  return User.findByIdAndUpdate(
    userId,
    {
      account_status: 'PROPER_BANNED',
      isBlocked: true,
      ban_timestamp: new Date(),
      banReason: reason,
      bannedBy: adminId
    },
    { new: true }
  ).exec();
};

export const undoBan = async (userId: string) => {
  return User.findByIdAndUpdate(
    userId,
    {
      account_status: 'ACTIVE',
      isBlocked: false,
      ban_timestamp: null,
      banReason: null,
      bannedBy: null
    },
    { new: true }
  ).exec();
};

export const isPermanentDeletionDue = (user: IUser): boolean => {
  if (user.account_status !== 'PROPER_BANNED' || !user.ban_timestamp) {
    return false;
  }

  const hoursSinceBan = (Date.now() - user.ban_timestamp.getTime()) / (1000 * 60 * 60);
  return hoursSinceBan > 48;
};

export const getUsersForPermanentDeletion = async () => {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  return User.find({
    account_status: 'PROPER_BANNED',
    ban_timestamp: { $lte: fortyEightHoursAgo }
  }).exec();
};

export default User;
