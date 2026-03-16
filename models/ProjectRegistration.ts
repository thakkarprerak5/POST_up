import mongoose from 'mongoose';

// Mentor Invitation Schema
const mentorInvitationSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  projectDescription: {
    type: String,
    required: true,
    trim: true
  },
  proposalUrl: {
    type: String,
    required: true
  },
  proposalFileName: {
    type: String,
    required: true
  },
  optionalMessage: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  responseMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Project Registration Schema
const projectRegistrationSchema = new mongoose.Schema({
  registrationType: {
    type: String,
    enum: ['individual', 'group'],
    required: true
  },
  mentorAssignmentMethod: {
    type: String,
    enum: ['invitation', 'admin'],
    required: true
  },
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  projectDescription: {
    type: String,
    required: true,
    trim: true
  },
  proposalUrl: {
    type: String,
    required: true
  },
  proposalFileName: {
    type: String,
    required: true
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  mentorInvitationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorInvitation',
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'pending_mentor', 'active', 'mentor_accepted', 'completed'],
    default: 'draft'
  },
  // For group registrations
  groupName: {
    type: String,
    trim: true
  },
  groupMembers: [{
    name: String,
    email: String
  }],
  isGroupLead: {
    type: Boolean,
    default: false
  },
  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  mentorAssignedAt: {
    type: Date
  },
  activatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
mentorInvitationSchema.index({ mentorId: 1, status: 1 });
mentorInvitationSchema.index({ studentId: 1, status: 1 });
mentorInvitationSchema.index({ sentAt: -1 });

projectRegistrationSchema.index({ registeredBy: 1, status: 1 });
projectRegistrationSchema.index({ mentorId: 1, status: 1 });
projectRegistrationSchema.index({ status: 1, submittedAt: -1 });

// Prevent duplicate pending invitations for same student-mentor pair
mentorInvitationSchema.index(
  { mentorId: 1, studentId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

export const ProjectRegistrationInvitation = mongoose.models.ProjectRegistrationInvitation || mongoose.model('ProjectRegistrationInvitation', mentorInvitationSchema);
export const ProjectRegistration = mongoose.models.ProjectRegistration || mongoose.model('ProjectRegistration', projectRegistrationSchema);
