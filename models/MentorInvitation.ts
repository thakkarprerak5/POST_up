import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorInvitation extends Document {
  mentorId: string;
  studentId: string;
  groupId?: string; // NEW: For group invitations
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  proposalFile?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'removed';
  message?: string;
  sentAt: Date;
  respondedAt?: Date;
  responseMessage?: string;
  // Group snapshot for invitations
  groupSnapshot?: {
    lead: {
      id: string;
      name: string;
      email: string;
    };
    members: Array<{
      id?: string;
      name?: string;
      email: string;
      status: 'active' | 'pending';
    }>;
  };
  // Removal fields
  removedBy?: string; // Who removed the assignment (mentor or admin)
  removedAt?: Date; // When it was removed
  removalReason?: string; // Reason for removal
}

const MentorInvitationSchema = new Schema<IMentorInvitation>({
  mentorId: { type: String, required: true, ref: 'User' },
  studentId: { type: String, required: true, ref: 'User' },
  groupId: { type: String, required: false, ref: 'Group' }, // NEW: Optional group ID for group invitations
  projectId: { type: String, required: true, ref: 'Project' },
  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  proposalFile: { type: String },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'removed'],
    default: 'pending'
  },
  message: { type: String },
  sentAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  responseMessage: { type: String },
  // Group snapshot for invitations (OPTIONAL - only for group projects)
  groupSnapshot: {
    type: {
      lead: {
        type: {
          id: { type: String },
          name: { type: String },
          email: { type: String }
        }
      },
      members: {
        type: [{
          id: { type: String },
          name: { type: String },
          email: { type: String },
          status: { type: String, enum: ['active', 'pending'] }
        }]
      }
    },
    required: false,
    default: undefined
  },
  // Removal fields
  removedBy: { type: String, ref: 'User' },
  removedAt: { type: Date },
  removalReason: { type: String }
}, { timestamps: true });

// Index to prevent duplicate invitations
MentorInvitationSchema.index(
  { mentorId: 1, studentId: 1, projectId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

// Standard Mongoose pattern for Next.js to prevent OverwriteModelError
const MentorInvitation = mongoose.models.MentorInvitation || mongoose.model<IMentorInvitation>('MentorInvitation', MentorInvitationSchema);

export default MentorInvitation;

// Helper functions
export const createMentorInvitation = async (invitationData: Omit<IMentorInvitation, keyof Document>) => {
  const invitation = new MentorInvitation(invitationData);
  return invitation.save();
};

// Idempotent mentor invitation creation - prevents duplicate invitations
export const findOrCreateMentorInvitation = async (invitationData: {
  mentorId: string;
  studentId: string;
  projectId: string;
  groupId?: string;
  projectTitle: string;
  projectDescription: string;
  proposalFile?: string;
  message?: string;
  groupSnapshot?: any;
}) => {
  try {
    // Check if invitation already exists
    const existingInvitation = await MentorInvitation.findOne({
      mentorId: invitationData.mentorId,
      projectId: invitationData.projectId,
      status: 'pending'
    }).exec();

    if (existingInvitation) {
      console.log('🔍 Pending invitation already exists, returning existing:', existingInvitation._id);
      return { invitation: existingInvitation, created: false };
    }

    // Create new invitation
    const invitation = await createMentorInvitation({
      ...invitationData,
      sentAt: new Date(),
      status: 'pending'
    });

    console.log('✅ Mentor invitation created successfully:', invitation._id);
    return { invitation, created: true };

  } catch (error: any) {
    // Handle any other errors
    console.error('❌ Error creating mentor invitation:', error);
    throw error;
  }
};

export const findInvitationById = async (id: string) => {
  return MentorInvitation.findById(id).populate('mentorId').populate('studentId').populate('groupId').exec();
};

export const findInvitationsByMentor = async (mentorId: string) => {
  return MentorInvitation.find({ mentorId })
    .populate('studentId')
    .populate('projectId')
    .populate('groupId')
    .sort({ sentAt: -1 })
    .exec();
};

export const findInvitationsByStudent = async (studentId: string) => {
  return MentorInvitation.find({ studentId })
    .populate('mentorId')
    .populate('projectId')
    .populate('groupId')
    .sort({ sentAt: -1 })
    .exec();
};

export const getMentorInvitations = async (mentorId: string, status?: string) => {
  const query: any = { mentorId };
  if (status) {
    query.status = status;
  }

  console.log('🔍 getMentorInvitations query:', { mentorId, status, query });

  const invitations = await MentorInvitation.find(query)
    .populate('studentId', 'fullName email photo')
    .populate('projectId', 'title createdAt registrationType group')
    .populate({
      path: 'groupId',
      select: 'name description studentIds lead',
      populate: [
        { path: 'studentIds', select: 'fullName email photo' },
        { path: 'lead', select: 'fullName email photo' }
      ]
    })
    .sort({ sentAt: -1 })
    .exec();

  console.log('🔍 getMentorInvitations result count:', invitations.length);

  return invitations;
};

export const updateInvitationStatus = async (
  invitationId: string,
  status: 'accepted' | 'rejected',
  responseMessage?: string
) => {
  console.log('🔍 updateInvitationStatus called with:', { invitationId, status, responseMessage });

  const result = await MentorInvitation.findByIdAndUpdate(
    invitationId,
    {
      status,
      respondedAt: new Date(),
      responseMessage
    },
    { new: true }
  )
    .populate('mentorId', 'fullName email photo')
    .populate('studentId', 'fullName email photo')
    .populate('projectId', 'title createdAt')
    .exec();

  console.log('🔍 MentorInvitation.findByIdAndUpdate result:', result);
  return result;
};

export const getStudentInvitations = async (studentId: string) => {
  return MentorInvitation.find({ studentId })
    .populate('mentorId', 'fullName email photo')
    .populate('projectId', 'title createdAt')
    .sort({ sentAt: -1 })
    .exec();
};

export const removeMentorInvitation = async (
  invitationId: string,
  removedBy: string,
  removalReason?: string
) => {
  console.log('🗑️ removeMentorInvitation called:', { invitationId, removedBy, removalReason });

  const result = await MentorInvitation.findByIdAndUpdate(
    invitationId,
    {
      status: 'removed',
      removedBy,
      removedAt: new Date(),
      removalReason
    },
    { new: true }
  )
    .populate('mentorId', 'fullName email photo')
    .populate('studentId', 'fullName email photo')
    .populate('projectId', 'title createdAt')
    .exec();

  console.log('🗑️ MentorInvitation removal result:', result);
  return result;
};
