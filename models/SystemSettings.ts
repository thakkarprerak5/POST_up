import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    platform: {
        approvalMode: 'manual' | 'auto';
        mentorApprovalRequired: boolean;
        maxGroupSize: number;
        allowProjectUploads: boolean;
        maintenanceMode: boolean;
    };
    security: {
        enforce2FA: boolean;
        sessionTimeout: number; // in minutes
        allowedLoginDomains: string[];
        passwordPolicy: {
            minLength: number;
            requireSpecialChar: boolean;
        };
    };
    updatedBy: string; // User ID of the last admin who updated settings
    updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    platform: {
        approvalMode: { type: String, enum: ['manual', 'auto'], default: 'manual' },
        mentorApprovalRequired: { type: Boolean, default: true },
        maxGroupSize: { type: Number, default: 4 },
        allowProjectUploads: { type: Boolean, default: true },
        maintenanceMode: { type: Boolean, default: false }
    },
    security: {
        enforce2FA: { type: Boolean, default: false },
        sessionTimeout: { type: Number, default: 60 },
        allowedLoginDomains: { type: [String], default: [] },
        passwordPolicy: {
            minLength: { type: Number, default: 8 },
            requireSpecialChar: { type: Boolean, default: false }
        }
    },
    updatedBy: { type: String, ref: 'User' },
}, { timestamps: true });

// Singleton pattern: ensure only one settings document exists
SystemSettingsSchema.statics.getInstance = async function (): Promise<ISystemSettings> {
    const settings = await this.findOne();
    if (settings) {
        return settings;
    }
    // Create default settings if none exist
    return await this.create({});
};

const SystemSettings = (mongoose.models.SystemSettings as mongoose.Model<ISystemSettings>) ||
    mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
