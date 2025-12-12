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
}, { timestamps: true });

const Project = (global as any).Project || mongoose.model<IProject>('Project', ProjectSchema);

if (process.env.NODE_ENV === 'development') {
  (global as any).Project = Project;
}

export const createProject = async (data: Omit<IProject, keyof Document>) => {
  const project = new Project(data);
  return project.save();
};

export const listProjects = async (query: any = {}, options: { limit?: number; sort?: any } = {}) => {
  const { limit = 20, sort = { createdAt: -1 } } = options;
  return Project.find(query).sort(sort).limit(limit).exec();
};

export default Project;
