import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentProfile extends Document {
    userId: mongoose.Types.ObjectId;
    enrollmentNo: string;
    course: string;
    branch: string;
    bio: string;
    skills: string[];
    socialLinks: {
        github: string;
        linkedin: string;
        portfolio: string;
    };
    joinedDate: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enrollmentNo: { type: String, required: true },
    course: { type: String, required: true },
    branch: { type: String, required: true },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    socialLinks: {
        github: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        portfolio: { type: String, default: '' }
    },
    joinedDate: { type: Date, default: Date.now }
}, { timestamps: true });

const StudentProfile = mongoose.models.StudentProfile || mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);

export default StudentProfile;
