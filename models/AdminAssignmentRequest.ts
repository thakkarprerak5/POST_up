// models/AdminAssignmentRequest.ts - Admin Mentor Assignment Request System
import mongoose, { Document, Model, Schema } from 'mongoose';
import './Group'; // Ensure Group model is registered
import User from './User'; // Ensure User model is registered
import Project from './Project'; // Ensure Project model is registered
import MentorAssignment, { createMentorAssignment } from './MentorAssignment';

export interface IAdminAssignmentRequest extends Document {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  proposalFile?: string;
  requestedBy: string; // Student or group lead who made the request
  requestedToType: 'student' | 'group'; // Type of entity requesting mentor
  requestType: 'INDIVIDUAL' | 'GROUP'; // NEW: Request type classification
  studentId?: string; // nullable - only if requestedToType = student
  groupId?: string; // nullable - only if requestedToType = group
  status: 'pending' | 'assigned' | 'cancelled' | 'removed';
  assignedMentorId?: string; // When assigned by admin
  assignedBy?: string; // Admin who assigned the mentor
  assignedAt?: Date; // When mentor was assigned
  // Group snapshot for requests
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
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced group data interface for populated requests
export interface PopulatedGroupData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lead?: {
    id: string;
    fullName: string;
    email: string;
    photo: string;
  };
  members: Array<{
    id: string;
    fullName: string;
    email: string;
    photo: string;
    isGroupLead: boolean;
  }>;
  memberCount: number;
  error?: string;
}

const adminAssignmentRequestSchema = new Schema<IAdminAssignmentRequest>({
  projectId: { type: String, ref: 'Project', required: true },
  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  proposalFile: { type: String, default: null },
  requestedBy: { type: String, ref: 'User', required: true },
  requestedToType: { type: String, enum: ['student', 'group'], required: true },
  requestType: { type: String, enum: ['INDIVIDUAL', 'GROUP'], required: true }, // NEW: Request type
  studentId: { type: String, ref: 'User', default: null },
  groupId: { 
    type: String, 
    ref: 'Group', 
    default: null,
    validate: {
      validator: function(this: IAdminAssignmentRequest, value: string) {
        // groupId is required when requestedToType is 'group'
        if (this.requestedToType === 'group') {
          return value !== null && value !== undefined && value.trim() !== '';
        }
        return true; // Optional for student requests
      },
      message: 'groupId is required for group assignment requests'
    }
  },
  status: { type: String, enum: ['pending', 'assigned', 'cancelled', 'removed'], default: 'pending' },
  assignedMentorId: { type: String, ref: 'User', default: null },
  assignedBy: { type: String, ref: 'User', default: null },
  assignedAt: { type: Date, default: null },
  // Group snapshot for requests
  groupSnapshot: {
    lead: {
      id: { type: String, required: false }, // Made optional for backward compatibility
      name: { type: String, required: false }, // Made optional for backward compatibility
      email: { type: String, required: false } // Made optional for backward compatibility
    },
    members: [{
      id: { type: String },
      name: { type: String },
      email: { type: String, required: true },
      status: { type: String, enum: ['active', 'pending'], required: true }
    }]
  },
  // Removal fields
  removedBy: { type: String, ref: 'User', default: null },
  removedAt: { type: Date, default: null },
  removalReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for faster queries
adminAssignmentRequestSchema.index({ status: 1, createdAt: -1 });
adminAssignmentRequestSchema.index({ studentId: 1, status: 1 });
adminAssignmentRequestSchema.index({ groupId: 1, status: 1 });
adminAssignmentRequestSchema.index({ requestedBy: 1, status: 1 });

// Compound index to prevent duplicate requests for same project
adminAssignmentRequestSchema.index(
  { projectId: 1, status: 1 }, 
  { partialFilterExpression: { status: 'pending' } }
);

// Create model if it doesn't exist
const AdminAssignmentRequest = (global as any).AdminAssignmentRequest || 
  mongoose.models.AdminAssignmentRequest ||
  mongoose.model<IAdminAssignmentRequest>('AdminAssignmentRequest', adminAssignmentRequestSchema, 'adminassignmentrequests');

// Cache the model globally
if (process.env.NODE_ENV === 'development') {
  (global as any).AdminAssignmentRequest = AdminAssignmentRequest;
}

// Helper functions
export const createAdminAssignmentRequest = async (requestData: {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  proposalFile?: string;
  requestedBy: string;
  requestedToType: 'student' | 'group';
  requestType: 'INDIVIDUAL' | 'GROUP'; // NEW: Request type
  studentId?: string;
  groupId?: string;
  groupSnapshot?: any; // New parameter
}) => {
  console.log('➕ AdminAssignmentRequest: Creating request:', requestData);
  
  // 🔴 MANDATORY VALIDATION: groupId is required for group requests
  if (requestData.requestedToType === 'group' && (!requestData.groupId || requestData.groupId.trim() === '')) {
    throw new Error('groupId is required for group assignment requests');
  }
  
  // 🔴 MANDATORY VALIDATION: studentId is required for student requests
  if (requestData.requestedToType === 'student' && (!requestData.studentId || requestData.studentId.trim() === '')) {
    throw new Error('studentId is required for student assignment requests');
  }
  
  const request = new AdminAssignmentRequest(requestData);
  const result = await request.save();
  console.log('✅ AdminAssignmentRequest: Request created:', result);
  return result;
};

export const getPendingAdminAssignmentRequests = async () => {
  console.log('🔍 getPendingAdminAssignmentRequests called');
  try {
    const requests = await AdminAssignmentRequest.find({ 
      status: 'pending' 
    })
      .populate('requestedBy', 'fullName email photo')
      .populate('studentId', 'fullName email photo')
      .populate('groupId', 'name description')
      .populate('projectId', 'title description proposalFile createdAt tags registrationType group')
      .sort({ createdAt: -1 })
      .exec();
    
    console.log('✅ getPendingAdminAssignmentRequests result:', requests.length);
    return requests;
  } catch (error) {
    console.error('❌ getPendingAdminAssignmentRequests error:', error);
    throw error;
  }
};

export const getAllAdminAssignmentRequests = async () => {
  console.log('🔍 getAllAdminAssignmentRequests called');
  try {
    // Get all requests first
    const requests = await AdminAssignmentRequest.find({}).sort({ createdAt: -1 }).lean().exec();
    
    // Manually populate the data
    const populatedRequests = await Promise.all(requests.map(async (request: any) => {
      const populatedRequest = { ...request };
      
      // 🔴 VALIDATION: Check for broken group references
      if (request.requestedToType === 'group' && !request.groupId) {
        console.error('❌ BROKEN DATA: Group request missing groupId:', {
          requestId: request._id,
          projectTitle: request.projectTitle,
          requestedToType: request.requestedToType,
          groupId: request.groupId
        });
        populatedRequest.groupId = {
          id: null,
          name: 'Group Reference Missing',
          description: '',
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lead: undefined,
          members: [],
          memberCount: 0,
          error: 'CRITICAL: Group request missing groupId - Data integrity violation'
        } as PopulatedGroupData;
      }
      
      // Populate requestedBy
      if (request.requestedBy) {
        const User = mongoose.model('User');
        const requestedByUser = await User.findById(request.requestedBy).select('fullName email photo').lean();
        populatedRequest.requestedBy = requestedByUser;
      }
      
      // Populate studentId
      if (request.studentId) {
        const User = mongoose.model('User');
        const studentUser = await User.findById(request.studentId).select('fullName email photo').lean();
        populatedRequest.studentId = studentUser;
      }
      
      // Populate groupId with complete group information including lead and members
      if (request.groupId) {
        const Group = mongoose.model('Group');
        const group: any = await Group.findById(request.groupId).lean();
        
        if (group) {
          // Fetch all group members with their profiles
          let groupMembers: Array<{
            id: string;
            fullName: string;
            email: string;
            photo: string;
            isGroupLead: boolean;
          }> = [];
          let groupLead: typeof groupMembers[0] | null = null;
          
          if (group.studentIds && group.studentIds.length > 0) {
            const User = mongoose.model('User');
            const students = await User.find({ 
              _id: { $in: group.studentIds } 
            }).select('fullName email photo profile').lean();
            
            // Separate group lead from regular members
            groupMembers = students.map((student: any) => ({
              id: student._id.toString(),
              fullName: student.fullName,
              email: student.email,
              photo: student.photo,
              isGroupLead: student.profile?.isGroupLead || false
            }));
            
            // 🔴 ENHANCED: Find group lead using multiple methods
            groupLead = groupMembers.find(member => member.isGroupLead);
            
            // If no explicit group lead found, try to identify from groupSnapshot
            if (!groupLead && request.groupSnapshot?.lead?.email) {
              groupLead = groupMembers.find(member => member.email === request.groupSnapshot.lead.email);
            }
            
            // If still no lead found, use the first member as fallback
            if (!groupLead && groupMembers.length > 0) {
              console.warn('⚠️ No group lead identified, using first member as fallback');
              groupLead = groupMembers[0];
            }
            
            // Sort members: lead first, then others alphabetically
            groupMembers.sort((a, b) => {
              if (a.isGroupLead && !b.isGroupLead) return -1;
              if (!a.isGroupLead && b.isGroupLead) return 1;
              return a.fullName.localeCompare(b.fullName);
            });
          }
          
          populatedRequest.groupId = {
            id: group._id.toString(),
            name: group.name,
            description: group.description,
            isActive: group.isActive,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            lead: groupLead ? {
              id: groupLead.id,
              fullName: groupLead.fullName,
              email: groupLead.email,
              photo: groupLead.photo
            } : undefined,
            members: groupMembers,
            memberCount: groupMembers.length
          } as PopulatedGroupData;
        } else {
          // Group not found - provide structured error data
          console.error('❌ BROKEN DATA: Group reference points to non-existent group:', {
            requestId: request._id,
            groupId: request.groupId,
            projectTitle: request.projectTitle
          });
          populatedRequest.groupId = {
            id: request.groupId,
            name: 'Group Not Found',
            description: '',
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lead: undefined,
            members: [],
            memberCount: 0,
            error: 'CRITICAL: Group reference points to deleted/non-existent group'
          } as PopulatedGroupData;
        }
      }
      
      // Populate projectId
      if (request.projectId) {
        const Project = mongoose.model('Project');
        const project = await Project.findById(request.projectId).select('title description proposalFile createdAt tags registrationType group').lean();
        populatedRequest.projectId = project;
      }
      
      // Populate assignedMentorId
      if (request.assignedMentorId) {
        const User = mongoose.model('User');
        const mentorUser = await User.findById(request.assignedMentorId).select('fullName email photo').lean();
        populatedRequest.assignedMentorId = mentorUser;
      }
      
      // Populate assignedBy
      if (request.assignedBy) {
        const User = mongoose.model('User');
        const assignedByUser = await User.findById(request.assignedBy).select('fullName email').lean();
        populatedRequest.assignedBy = assignedByUser;
      }
      
      return populatedRequest;
    }));
    
    console.log('✅ getAllAdminAssignmentRequests result:', populatedRequests.length);
    
    // 🔴 REPORT BROKEN REQUESTS
    const brokenRequests = populatedRequests.filter(r => 
      r.requestedToType === 'group' && (!r.groupId || r.groupId?.error)
    );
    if (brokenRequests.length > 0) {
      console.error('❌ DATA INTEGRITY ISSUES FOUND:', brokenRequests.length, 'broken group requests');
      brokenRequests.forEach(r => {
        console.error('  - Broken Request:', {
          id: r._id,
          projectTitle: r.projectTitle,
          error: r.groupId?.error || 'Missing groupId'
        });
      });
    }
    
    return populatedRequests;
  } catch (error) {
    console.error('❌ getAllAdminAssignmentRequests error:', error);
    throw error;
  }
};

export const assignMentorToRequest = async (requestId: string, mentorId: string, assignedBy: string) => {
  console.log('👨‍🏫 assignMentorToRequest called:', { requestId, mentorId, assignedBy });
  try {
    const request = await AdminAssignmentRequest.findById(requestId);
    if (!request) {
      throw new Error('Admin assignment request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    // Start database transaction for data integrity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Ensure requestType is set (for backward compatibility)
      if (!request.requestType) {
        request.requestType = request.requestedToType === 'group' ? 'GROUP' : 'INDIVIDUAL';
      }
      
      // Update the request
      request.status = 'assigned';
      request.assignedMentorId = mentorId;
      request.assignedBy = assignedBy;
      request.assignedAt = new Date();
      request.updatedAt = new Date();

      const result = await request.save({ session });
      console.log('✅ Assignment request updated:', result);

      // NEW LIFECYCLE RULE: Activate the project
      const Project = mongoose.model('Project');
      const project = await Project.findById(request.projectId).session(session);
      
      if (!project) {
        throw new Error('Associated project not found');
      }

      console.log('🔄 Activating project:', project._id);
      
      // Update project to ACTIVE status with assigned mentor
      project.mentorId = mentorId;
      project.projectStatus = 'ACTIVE';
      project.mentorStatus = 'accepted';
      project.updatedAt = new Date();
      
      // Mark mentor as assigned for 3-step gate filtering
      if (project.origin === 'project_registration') {
        project.mentorAssigned = true;
        console.log('🚪 Marked project registration as mentor assigned');
      }
      
      await project.save({ session });
      console.log('✅ Project activated successfully');

      // Create mentor assignment
      await createMentorAssignment({
        mentorId,
        assignedToType: request.requestedToType,
        studentId: request.studentId,
        groupId: request.groupId,
        projectId: request.projectId, // NEW: Pass project ID
        assignedBy
      });

      console.log('✅ Mentor assignment created successfully');

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return result;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('❌ assignMentorToRequest error:', error);
    throw error;
  }
};

// NEW: Direct mentor assignment without request (Admin panel direct assignment)
export const assignMentorDirectly = async (projectId: string, mentorId: string, assignedBy: string, requestType: 'INDIVIDUAL' | 'GROUP') => {
  console.log('👨‍🏫 assignMentorDirectly called:', { projectId, mentorId, assignedBy, requestType });
  try {
    // Start database transaction for data integrity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find and activate the project directly
      const Project = mongoose.model('Project');
      const project = await Project.findById(projectId).session(session);
      
      if (!project) {
        throw new Error('Project not found');
      }

      console.log('🔄 Directly activating project:', project._id);
      
      // Update project to ACTIVE status with assigned mentor
      project.mentorId = mentorId;
      project.projectStatus = 'ACTIVE';
      project.mentorStatus = 'accepted';
      project.updatedAt = new Date();
      
      await project.save({ session });
      console.log('✅ Project activated directly');

      // Create mentor assignment based on project type
      await createMentorAssignment({
        mentorId,
        assignedToType: requestType === 'INDIVIDUAL' ? 'student' : 'group',
        studentId: requestType === 'INDIVIDUAL' ? project.authorId : undefined,
        groupId: requestType === 'GROUP' ? project.groupId : undefined,
        assignedBy
      });

      console.log('✅ Direct mentor assignment created successfully');

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return project;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('❌ assignMentorDirectly error:', error);
    throw error;
  }
};

export const cancelAdminAssignmentRequest = async (requestId: string, cancelledBy: string) => {
  console.log('❌ cancelAdminAssignmentRequest called:', { requestId, cancelledBy });
  try {
    const request = await AdminAssignmentRequest.findById(requestId);
    if (!request) {
      throw new Error('Admin assignment request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    request.status = 'cancelled';
    request.updatedAt = new Date();

    const result = await request.save();
    console.log('✅ cancelAdminAssignmentRequest result:', result);
    return result;
  } catch (error) {
    console.error('❌ cancelAdminAssignmentRequest error:', error);
    throw error;
  }
};

export const getAdminAssignmentRequestsByStudent = async (studentId: string) => {
  console.log('🔍 getAdminAssignmentRequestsByStudent called:', studentId);
  try {
    const requests = await AdminAssignmentRequest.find({ 
      $or: [
        { studentId },
        { requestedBy: studentId }
      ]
    })
      .populate('requestedBy', 'fullName email photo')
      .populate('studentId', 'fullName email photo')
      .populate('groupId', 'name description')
      .populate('projectId', 'title description proposalFile createdAt tags registrationType group')
      .populate('assignedMentorId', 'fullName email photo')
      .sort({ createdAt: -1 })
      .exec();
    
    console.log('✅ getAdminAssignmentRequestsByStudent result:', requests.length);
    return requests;
  } catch (error) {
    console.error('❌ getAdminAssignmentRequestsByStudent error:', error);
    throw error;
  }
};

export const getAdminAssignmentRequestsByGroup = async (groupId: string) => {
  console.log('🔍 getAdminAssignmentRequestsByGroup called:', groupId);
  try {
    const requests = await AdminAssignmentRequest.find({ 
      groupId 
    })
      .populate('requestedBy', 'fullName email photo')
      .populate('studentId', 'fullName email photo')
      .populate('groupId', 'name description')
      .populate('projectId', 'title description proposalFile createdAt tags registrationType group')
      .populate('assignedMentorId', 'fullName email photo')
      .sort({ createdAt: -1 })
      .exec();
    
    console.log('✅ getAdminAssignmentRequestsByGroup result:', requests.length);
    return requests;
  } catch (error) {
    console.error('❌ getAdminAssignmentRequestsByGroup error:', error);
    throw error;
  }
};

export const removeAdminAssignment = async (
  requestId: string, 
  removedBy: string, 
  removalReason?: string
) => {
  console.log('🗑️ removeAdminAssignment called:', { requestId, removedBy, removalReason });
  try {
    const request = await AdminAssignmentRequest.findById(requestId);
    if (!request) {
      throw new Error('Admin assignment request not found');
    }

    if (request.status !== 'assigned') {
      throw new Error('Request is not in assigned status');
    }

    // Update the request
    request.status = 'removed';
    request.removedBy = removedBy;
    request.removedAt = new Date();
    request.removalReason = removalReason;
    request.updatedAt = new Date();

    const result = await request.save();
    console.log('🗑️ removeAdminAssignment result:', result);

    // Remove corresponding mentor assignment
    await MentorAssignment.deleteOne({
      mentorId: request.assignedMentorId,
      assignedToType: request.requestedToType,
      studentId: request.studentId,
      groupId: request.groupId
    });

    console.log('✅ Mentor assignment removed successfully');
    return result;
  } catch (error) {
    console.error('❌ removeAdminAssignment error:', error);
    throw error;
  }
};

// NEW: Function to completely remove canceled requests
export const removeCanceledRequest = async (requestId: string, removedBy: string, removalReason?: string) => {
  console.log('🗑️ removeCanceledRequest called:', { requestId, removedBy, removalReason });
  try {
    const request = await AdminAssignmentRequest.findById(requestId);
    if (!request) {
      console.log('❌ Request not found for ID:', requestId);
      throw new Error('Admin assignment request not found');
    }

    console.log('📋 Found request:', {
      id: request._id,
      status: request.status,
      title: request.projectTitle
    });

    // Only allow removal of canceled requests
    if (request.status !== 'cancelled') {
      console.log('❌ Request not in cancelled status:', request.status);
      throw new Error('Request must be in cancelled status to be removed');
    }

    // Simplified: Update directly without transaction for now
    request.status = 'removed';
    request.removedBy = removedBy;
    request.removedAt = new Date();
    request.removalReason = removalReason || 'Removed by admin';
    request.updatedAt = new Date();

    console.log('🔄 Updating request with removal info:', {
      id: request._id,
      status: request.status,
      removedBy: removedBy,
      removedAt: request.removedAt,
      removalReason: request.removalReason
    });

    const result = await request.save();
    console.log('✅ Canceled request marked as removed:', result);

    return result;
  } catch (error) {
    console.error('❌ removeCanceledRequest error:', error);
    throw error;
  }
};

// Static methods
AdminAssignmentRequest.getAllAdminAssignmentRequests = getAllAdminAssignmentRequests;
AdminAssignmentRequest.createAdminAssignmentRequest = createAdminAssignmentRequest;
AdminAssignmentRequest.assignMentorToRequest = assignMentorToRequest;
AdminAssignmentRequest.assignMentorDirectly = assignMentorDirectly; // NEW
AdminAssignmentRequest.cancelAdminAssignmentRequest = cancelAdminAssignmentRequest;
AdminAssignmentRequest.removeCanceledRequest = removeCanceledRequest; // NEW

export default AdminAssignmentRequest;
