import mongoose, { Document, Schema } from 'mongoose';

export interface IMentorProfile extends Document {
    userId: mongoose.Types.ObjectId;
    expertise: string[];
    experience: number;
    company: string;
    bio: string;
    skills: string[];
    department?: string;
    position?: string;
    researchAreas?: string[];
    achievements?: string[];
    officeHours?: string;
    socialLinks?: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
    };
    joinedDate: Date;
}

const MentorProfileSchema = new Schema<IMentorProfile>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    expertise: { type: [String], default: [] },
    experience: { type: Number, default: 0 },
    company: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    department: { type: String, default: '' },
    position: { type: String, default: 'Mentor' },
    researchAreas: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    officeHours: { type: String, default: 'To be scheduled' },
    socialLinks: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' }
    },
    joinedDate: { type: Date, default: Date.now }
}, { timestamps: true });

const MentorProfile = mongoose.models.MentorProfile || mongoose.model<IMentorProfile>('MentorProfile', MentorProfileSchema);

export default MentorProfile;
