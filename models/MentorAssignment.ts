// models/MentorAssignment.ts - NEW CLEAN IMPLEMENTATION
import mongoose, { Document, Model, Schema } from 'mongoose';
import './Group'; // Ensure Group model is registered
import User from './User'; // Ensure User model is registered
import { connectDB } from '@/lib/db';

export interface IMentorAssignment extends Document {
  mentorId: string;
  assignedToType: 'student' | 'group'; // Type of assignment
  studentId?: string; // nullable - only if assignedToType = student
  groupId?: string; // nullable - only if assignedToType = group
  projectId?: string; // Associated project ID
  assignedBy: string; // Admin/Super Admin who made the assignment
  assignedAt: Date; // When assignment was made
  status: 'active' | 'removed'; // Assignment status
}

const mentorAssignmentSchema = new Schema<IMentorAssignment>({
  mentorId: { type: String, ref: 'User', required: true },
  assignedToType: { type: String, enum: ['student', 'group'], required: true },
  studentId: { type: String, ref: 'User', default: null },
  groupId: { type: String, ref: 'Group', default: null },
  projectId: { type: String, ref: 'Project', default: null }, // Associated project ID
  assignedBy: { type: String, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'removed'], default: 'active' }
}, { timestamps: false });

// Compound index to prevent duplicate assignments (removed unique constraint to allow multiple assignments over time)
mentorAssignmentSchema.index(
  { mentorId: 1, studentId: 1, status: 1 },
  { partialFilterExpression: { studentId: { $exists: true, $ne: null }, status: 'active' } }
);

mentorAssignmentSchema.index(
  { mentorId: 1, groupId: 1, status: 1 },
  { partialFilterExpression: { groupId: { $exists: true, $ne: null }, status: 'active' } }
);

// Index for faster queries
mentorAssignmentSchema.index({ studentId: 1, status: 1 });
mentorAssignmentSchema.index({ groupId: 1, status: 1 });
mentorAssignmentSchema.index({ mentorId: 1, status: 1 });

// Create model if it doesn't exist
const MentorAssignment = (global as any).MentorAssignment ||
  mongoose.models.MentorAssignment ||
  mongoose.model<IMentorAssignment>('MentorAssignment', mentorAssignmentSchema, 'mentorassignments');

// Cache the model globally
if (process.env.NODE_ENV === 'development') {
  (global as any).MentorAssignment = MentorAssignment;
}

// Helper functions for new implementation
export const createMentorAssignment = async (assignmentData: {
  mentorId: string;
  assignedToType: 'student' | 'group';
  studentId?: string;
  groupId?: string;
  projectId?: string; // NEW: Associated project ID
  assignedBy: string;
}) => {
  console.log('➕ MentorAssignment: Creating assignment:', assignmentData);
  const assignment = new MentorAssignment(assignmentData);
  const result = await assignment.save();
  console.log('✅ MentorAssignment: Assignment created:', result);
  return result;
};

export const getActiveMentorForStudent = async (studentId: string) => {
  console.log('🔍 getActiveMentorForStudent called for:', studentId);
  try {
    // STEP 1: Find all groups this student belongs to
    console.log('📋 STEP 1: Finding groups for student:', studentId);

    // Import Group model here to avoid circular dependencies
    const Group = mongoose.models.Group;

    let studentGroupIds: string[] = [];

    if (Group) {
      // Find groups where student is either in members array or studentIds array or is the lead
      const studentGroups = await Group.find({
        $or: [
          { members: studentId },
          { studentIds: studentId },
          { lead: studentId }
        ]
      }).select('_id name members studentIds lead').exec();

      console.log('🔍 Found groups for student:', studentGroups.length);

      studentGroups.forEach(group => {
        studentGroupIds.push(group._id.toString());
        console.log(`➕ Student belongs to group: ${group.name} (${group._id})`);
        console.log(`   - Lead: ${group.lead}`);
        console.log(`   - Members: ${group.members?.length || 0}`);
        console.log(`   - StudentIds: ${group.studentIds?.length || 0}`);
      });

      console.log('📊 All group IDs for student:', studentGroupIds);
    } else {
      console.warn('⚠️ Group model not available, skipping group lookup');
    }

    // STEP 2: Query for mentor assignments (both individual and group)
    console.log('📋 STEP 2: Querying mentor assignments...');

    // Build the query to find assignments for this student
    const queryConditions = [
      // Individual assignment for this student
      {
        assignedToType: 'student',
        studentId: studentId,
        status: 'active'
      }
    ];

    // Add group assignments if student belongs to any groups
    if (studentGroupIds.length > 0) {
      queryConditions.push({
        assignedToType: 'group',
        groupId: { $in: studentGroupIds },
        status: 'active'
      });
      console.log(`🔍 Also checking ${studentGroupIds.length} group assignments`);
    }

    const query = {
      $or: queryConditions,
      status: 'active'
    };

    console.log('🔥 EXECUTING MENTOR ASSIGNMENT QUERY:', query);

    const assignment = await MentorAssignment.findOne(query)
      .populate('mentorId', 'fullName email photo')
      .populate('groupId', 'name')
      .sort({ assignedAt: -1 }) // Get the most recent assignment
      .exec();

    console.log('📊 MENTOR ASSIGNMENT QUERY RESULT:', {
      found: !!assignment,
      assignmentId: assignment?._id,
      mentorId: assignment?.mentorId,
      assignedToType: assignment?.assignedToType,
      studentId: assignment?.studentId,
      groupId: assignment?.groupId,
      projectName: assignment?.groupId?.name,
      status: assignment?.status,
      assignedAt: assignment?.assignedAt
    });

    if (assignment) {
      console.log('✅ getActiveMentorForStudent: Found mentor assignment');
      console.log(`📊 Assignment type: ${assignment.assignedToType}`);

      if (assignment.assignedToType === 'group') {
        console.log(`👥 Student gets mentor via group: ${assignment.groupId?.name}`);
      } else {
        console.log(`👤 Student gets mentor via individual assignment`);
      }

      console.log(`🎯 Mentor: ${assignment.mentorId?.fullName} (${assignment.mentorId?.email})`);
    } else {
      console.log('❌ getActiveMentorForStudent: No active mentor assignment found');
      console.log('🔍 Query conditions checked:');
      console.log(`   - Individual assignment for studentId: ${studentId}`);
      if (studentGroupIds.length > 0) {
        console.log(`   - Group assignments for groupIds: ${studentGroupIds.join(', ')}`);
      }
    }

    return assignment;
  } catch (error) {
    console.error('❌ getActiveMentorForStudent error:', error);
    throw error;
  }
};

export const getActiveMentorForGroup = async (groupId: string) => {
  console.log('🔍 getActiveMentorForGroup called for:', groupId);
  try {
    // Use string ID directly since groupId is stored as string in database
    const assignment = await MentorAssignment.findOne({
      groupId: groupId,
      status: 'active'
    })
      .populate('mentorId', 'fullName email photo')
      .populate('assignedBy', 'fullName')
      .sort({ assignedAt: -1 })
      .exec();

    console.log('✅ getActiveMentorForGroup result:', assignment);
    return assignment;
  } catch (error) {
    console.error('❌ getActiveMentorForGroup error:', error);
    throw error;
  }
};

export const getMentorForStudentGroup = async (studentId: string) => {
  console.log('🔍 getMentorForStudentGroup called for:', studentId);
  try {
    // First find all active group assignments
    const groupAssignments = await MentorAssignment.find({
      assignedToType: 'group',
      status: 'active'
    })
      .populate('groupId', 'name description members')
      .populate('mentorId', 'fullName email photo')
      .exec();

    console.log('🔍 Found group assignments:', groupAssignments.length);

    // Check if student is a member of any group that has a mentor
    for (const assignment of groupAssignments) {
      if (assignment.groupId && assignment.groupId.members) {
        const studentMember = assignment.groupId.members.find(
          (member: any) => member._id && member._id.toString() === studentId
        );

        if (studentMember) {
          console.log('✅ Student found in group with mentor:', assignment.mentorId?.fullName);
          return assignment;
        }
      }
    }

    console.log('❌ Student not found in any group with mentor');
    return null;
  } catch (error) {
    console.error('❌ getMentorForStudentGroup error:', error);
    throw error;
  }
};

export const getStudentsForMentor = async (mentorId: string) => {
  console.log('🎓 getStudentsForMentor called for:', mentorId);
  try {
    const result = await MentorAssignment.find({
      mentorId,
      studentId: { $exists: true, $ne: null },
      status: 'active'
    })
      .populate('studentId', 'fullName email photo')
      .sort({ assignedAt: -1 })
      .exec();
    console.log('✅ getStudentsForMentor result:', result);
    return result;
  } catch (error) {
    console.error('❌ getStudentsForMentor error:', error);
    throw error;
  }
};

export const getGroupsForMentor = async (mentorId: string) => {
  console.log('👥 getGroupsForMentor called for:', mentorId);
  try {
    const result = await MentorAssignment.find({
      mentorId,
      groupId: { $exists: true, $ne: null },
      status: 'active'
    })
      .populate('groupId', 'name description')
      .populate('studentIds')  // Populate group members with user details
      .sort({ assignedAt: -1 })
      .exec();
    console.log('✅ getGroupsForMentor result:', result);
    return result;
  } catch (error) {
    console.error('❌ getGroupsForMentor error:', error);
    throw error;
  }
};

export const getAllAssignmentsForMentor = async (mentorId: string) => {
  console.log('🎯 getAllAssignmentsForMentor called for:', mentorId);
  try {
    // Ensure database connection
    await connectDB();

    // Get only ACTIVE student assignments for this specific mentor
    const studentAssignments = await MentorAssignment.find({
      mentorId: mentorId,
      studentId: { $exists: true, $ne: null }, // Only get assignments where studentId exists
      status: 'active'
    })
      .populate('studentId', 'fullName email photo')
      .sort({ assignedAt: -1 })
      .lean()
      .exec();

    // Get only ACTIVE group assignments for this specific mentor  
    const groupAssignments = await MentorAssignment.find({
      mentorId: mentorId,
      groupId: { $exists: true, $ne: null }, // Only get assignments where groupId exists
      status: 'active'
    })
      .populate({
        path: 'groupId',
        select: 'name description lead studentIds members',
        populate: [
          { path: 'lead', select: 'fullName photo type email' },
          { path: 'studentIds', select: 'fullName photo type email' },
          { path: 'members', select: 'fullName photo type email' }
        ]
      })
      .sort({ assignedAt: -1 })
      .lean()
      .exec();

    console.log('✅ getAllAssignmentsForMentor - studentAssignments:', studentAssignments);
    console.log('✅ getAllAssignmentsForMentor - groupAssignments:', groupAssignments);

    // 1. Process Student Assignments Safely
    const processedStudentAssignments = studentAssignments.map(assignment => {
      const safeAssignment = typeof (assignment as any).toObject === 'function'
        ? (assignment as any).toObject()
        : assignment;

      return {
        ...safeAssignment,
        projectId: safeAssignment.projectId || null
      };
    });

    // 2. Process Group Assignments Safely
    const processedGroupAssignments = groupAssignments.map(assignment => {
      const safeAssignment = typeof (assignment as any).toObject === 'function'
        ? (assignment as any).toObject()
        : assignment;

      return {
        ...safeAssignment,
        projectId: safeAssignment.projectId || null
      };
    });

    // Manual populate if mongoose populate doesn't work with string IDs
    const populatedStudentAssignments = await Promise.all(
      processedStudentAssignments.map(async (assignment) => {
        if (assignment.studentId && typeof assignment.studentId === 'string') {
          try {
            const { ObjectId } = require('mongodb');
            const User = (global as any).User || mongoose.models.User;
            const student = await User.findById(new ObjectId(assignment.studentId)).select('fullName email photo').exec();
            return {
              ...assignment,
              student: student, // Add student field for API usage
              studentId: student // Keep studentId for backward compatibility
            };
          } catch (error) {
            console.error('❌ Error populating student:', assignment.studentId, error);
            return assignment;
          }
        } else if (assignment.studentId && typeof assignment.studentId === 'object') {
          // Already populated, just add student field
          return {
            ...assignment,
            student: assignment.studentId
          };
        }
        return assignment;
      })
    );

    // Manual populate for groups as well
    const populatedGroupAssignments = await Promise.all(
      processedGroupAssignments.map(async (assignment) => {
        if (assignment.groupId && typeof assignment.groupId === 'string') {
          try {
            const { ObjectId } = require('mongodb');
            const Group = (global as any).Group || mongoose.models.Group;
            // Updated to fetch full details
            const group = await Group.findById(new ObjectId(assignment.groupId))
              .select('name description lead studentIds')
              .populate('lead', 'fullName email photo type')
              .populate('studentIds', 'fullName email photo type')
              .exec();

            return {
              ...assignment,
              group: group, // Add group field for API usage
              groupId: group // Keep groupId for backward compatibility
            };
          } catch (error) {
            console.error('❌ Error populating group:', assignment.groupId, error);
            return assignment;
          }
        } else if (assignment.groupId && typeof assignment.groupId === 'object') {
          // Already populated, just add group field
          return {
            ...assignment,
            group: assignment.groupId
          };
        }
        return assignment;
      })
    );

    return {
      students: populatedStudentAssignments,
      groups: populatedGroupAssignments,
      mentors: [], // This mentor is not assigned as a student to anyone
      summary: {
        totalStudents: populatedStudentAssignments.length,
        totalGroups: populatedGroupAssignments.length,
        totalAssignments: populatedStudentAssignments.length + populatedGroupAssignments.length
      }
    };
  } catch (error) {
    console.error('❌ Error in getAllAssignmentsForMentor:', error);
    throw error;
  }
};

export const findAssignmentsByMentor = async (mentorId: string) => {
  return MentorAssignment.find({ mentorId })
    .populate('mentorId', 'fullName email photo')
    .populate('studentId', 'fullName email photo')
    .populate('groupId', 'name description')
    .populate('assignedBy', 'fullName')
    .sort({ createdAt: -1 })
    .exec();
};

export const deactivateMentorAssignment = async (mentorId: string, studentId?: string, groupId?: string) => {
  console.log('🗑️ deactivateMentorAssignment called');
  const query: any = { mentorId, status: 'active' };

  if (studentId) {
    query.studentId = studentId;
  } else if (groupId) {
    query.groupId = groupId;
  }

  console.log('🗑️ MentorAssignment: Deactivating with query:', query);

  // Deactivate instead of delete to maintain history
  const result = await MentorAssignment.updateOne(
    query,
    { status: 'removed' }
  ).exec();

  console.log('🗑️ MentorAssignment: Deactivate result:', result);
  return result;
};

export const checkAssignmentExists = async (mentorId: string, studentId?: string, groupId?: string) => {
  const query: any = { mentorId, status: 'active' };

  if (studentId) {
    query.studentId = studentId;
  } else if (groupId) {
    query.groupId = groupId;
  }

  return MentorAssignment.exists(query).exec();
};

/**
 * Remove mentor assignment function
 * Deactivates a mentor assignment instead of deleting to maintain history
 */
export const getMentorAssignmentsForDashboard = async (mentorId: string) => {
  console.log('🎯 getMentorAssignmentsForDashboard called for mentor:', mentorId);
  try {
    await connectDB();

    // Get both individual and group assignments for this mentor
    const [individualAssignments, groupAssignments] = await Promise.all([
      // Individual assignments
      MentorAssignment.find({
        mentorId: mentorId,
        assignedToType: 'student',
        status: 'active'
      })
        .populate('studentId', 'fullName email photo')
        .populate('projectId', 'title')
        .sort({ assignedAt: -1 })
        .exec(),

      // Group assignments
      MentorAssignment.find({
        mentorId: mentorId,
        assignedToType: 'group',
        status: 'active'
      })
        .populate('groupId', 'name description studentIds')
        .populate('projectId', 'title')
        .sort({ assignedAt: -1 })
        .exec()
    ]);

    console.log(`📊 Found ${individualAssignments.length} individual assignments`);
    console.log(`📊 Found ${groupAssignments.length} group assignments`);

    // Process group assignments to get all student members
    const processedGroupAssignments = await Promise.all(
      groupAssignments.map(async (assignment) => {
        if (assignment.groupId && assignment.groupId.studentIds) {
          // Get detailed student information for group members
          const Group = mongoose.model('Group');
          const groupDetails = await Group.findById(assignment.groupId._id)
            .populate('studentIds', 'fullName email photo')
            .populate('lead', 'fullName email photo')
            .exec();

          return {
            ...assignment.toObject(),
            groupDetails: groupDetails,
            totalMembers: groupDetails?.studentIds?.length || 0,
            members: groupDetails?.studentIds || [],
            lead: groupDetails?.lead
          };
        }
        return assignment.toObject();
      })
    );

    return {
      individual: individualAssignments,
      groups: processedGroupAssignments,
      summary: {
        totalIndividual: individualAssignments.length,
        totalGroups: groupAssignments.length,
        totalStudents: individualAssignments.length +
          processedGroupAssignments.reduce((sum, group) => sum + (group.totalMembers || 0), 0)
      }
    };

  } catch (error) {
    console.error('❌ Error in getMentorAssignmentsForDashboard:', error);
    throw error;
  }
};

export const removeMentorAssignment = async (mentorId: string, studentId?: string, groupId?: string) => {
  console.log('🗑️ removeMentorAssignment called');
  console.log('🗑️ Input params:', { mentorId, studentId, groupId });

  // Simple query first - no ObjectId conversion
  const query: any = { status: 'active' };

  if (studentId) {
    query.studentId = studentId;
    query.mentorId = mentorId;
  } else if (groupId) {
    query.groupId = groupId;
    query.mentorId = mentorId;
  }

  console.log('🗑️ Final query:', query);

  try {
    const result = await MentorAssignment.updateOne(
      query,
      { status: 'removed' }
    ).exec();

    console.log('🗑️ Update result:', result);
    return result;
  } catch (error) {
    console.error('🗑️ Update error:', error);
    throw error;
  }
};

export default MentorAssignment;
