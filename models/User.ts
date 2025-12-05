// models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IProfile {
  type: 'student' | 'mentor';
  joinedDate: Date;
  bio?: string;
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
  fullName: string;
  email: string;
  password: string;
  photo?: string;
  type: 'student' | 'mentor';
  profile: IProfile;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define profile schema
const profileSchema = new Schema<IProfile>({
  type: { type: String, enum: ['student', 'mentor'], required: true },
  joinedDate: { type: Date, default: Date.now },
  bio: { type: String, default: '' },
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
  type: { type: String, enum: ['student', 'mentor'], required: true },
  profile: { type: profileSchema, required: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create model if it doesn't exist
const User = (global as any).User || mongoose.model<IUser>('User', userSchema);

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
  return User.findById(id).exec();
};

export const updateUserProfile = async (
  id: string,
  updateData: Partial<IProfile> & { username?: string }
) => {
  const set: Record<string, any> = {};

  if (updateData.bio !== undefined) set['profile.bio'] = updateData.bio;
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

export default User;
