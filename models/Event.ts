import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEvent extends Document {
    title: string;
    description: string;
    coverImage?: string;
    videoUrl?: string; // Optional video URL
    date: Date;
    time: string; // "HH:MM" format
    duration?: number; // minutes
    location?: string; // "Online" or physical location
    organizerId: mongoose.Types.ObjectId;
    attendees: mongoose.Types.ObjectId[];
    maxAttendees?: number;
    tags: string[]; // Tags for categorization
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    visibility: 'public' | 'private';
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    coverImage: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 60 }, // Default 60 minutes
    location: { type: String, default: 'Online' },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxAttendees: { type: Number },
    tags: [{ type: String, trim: true }], // Tags for categorization
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
        index: true
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    }
}, {
    timestamps: true,
    collection: 'events'
});

// Compound index for efficient querying of public upcoming events
EventSchema.index({ status: 1, visibility: 1, date: 1 });

// Create model if it doesn't exist
const Event = (global as any).Event || mongoose.model<IEvent>('Event', EventSchema);

// For development
if (process.env.NODE_ENV === 'development') {
    (global as any).Event = Event;
}

// Helper functions
export const createEvent = async (eventData: Partial<IEvent>) => {
    const event = new Event(eventData);
    return event.save();
};

export const findEventById = async (eventId: string) => {
    return Event.findById(eventId).populate('organizerId', 'fullName email photo type').exec();
};

export const findUpcomingEvents = async (limit: number = 50) => {
    const now = new Date();
    return Event.find({
        status: { $in: ['upcoming', 'ongoing'] },
        visibility: 'public',
        date: { $gte: now }
    })
        .populate('organizerId', 'fullName email photo type')
        .sort({ date: 1 })
        .limit(limit)
        .exec();
};

export const findEventsByOrganizer = async (organizerId: string) => {
    return Event.find({ organizerId })
        .sort({ date: -1 })
        .exec();
};

export const updateEvent = async (eventId: string, updateData: Partial<IEvent>) => {
    return Event.findByIdAndUpdate(eventId, updateData, { new: true }).exec();
};

export const deleteEvent = async (eventId: string) => {
    return Event.findByIdAndDelete(eventId).exec();
};

export const registerAttendee = async (eventId: string, userId: string) => {
    return Event.findByIdAndUpdate(
        eventId,
        { $addToSet: { attendees: userId } },
        { new: true }
    ).exec();
};

export const unregisterAttendee = async (eventId: string, userId: string) => {
    return Event.findByIdAndUpdate(
        eventId,
        { $pull: { attendees: userId } },
        { new: true }
    ).exec();
};

export default Event;
