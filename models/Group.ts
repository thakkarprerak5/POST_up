// models/Group.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  mentorId?: string; // Mentor assigned to this group
  lead?: string; // Group lead user ID
  members?: string[]; // Array of member user IDs (legacy support)
  studentIds: string[]; // Array of student IDs (primary field)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  mentorId: { type: String, ref: 'User', default: null }, // Reference to User with mentor role
  lead: { type: String, ref: 'User', default: null }, // Group lead reference
  members: [{ type: String, ref: 'User' }], // Legacy members array
  studentIds: [{ type: String, ref: 'User' }], // Array of student user IDs (primary)
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes for efficient group member queries
groupSchema.index({ lead: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ studentIds: 1 });
groupSchema.index({ mentorId: 1 });

// Create model if it doesn't exist
const Group = (global as any).Group || 
  mongoose.models.Group ||
  mongoose.model<IGroup>('Group', groupSchema, 'groups');

// Cache the model globally
if (process.env.NODE_ENV === 'development') {
  (global as any).Group = Group;
}

// Helper functions
export const createGroup = async (groupData: Omit<IGroup, keyof Document>) => {
  const group = new Group(groupData);
  return group.save();
};

export const findGroupById = async (id: string) => {
  return Group.findById(id).populate('mentorId').populate('studentIds').exec();
};

export const findAllGroups = async () => {
  return Group.find({ isActive: true }).populate('mentorId').populate('studentIds').exec();
};

export const updateGroup = async (id: string, updateData: Partial<IGroup>) => {
  return Group.findByIdAndUpdate(id, updateData, { new: true }).exec();
};

export const addStudentToGroup = async (groupId: string, studentId: string) => {
  return Group.findByIdAndUpdate(
    groupId,
    { 
      $addToSet: { studentIds: studentId, members: studentId },
      updatedAt: new Date()
    },
    { new: true }
  ).exec();
};

export const removeStudentFromGroup = async (groupId: string, studentId: string) => {
  return Group.findByIdAndUpdate(
    groupId,
    { 
      $pull: { studentIds: studentId, members: studentId },
      updatedAt: new Date()
    },
    { new: true }
  ).exec();
};

// Idempotent group creation - prevents E11000 duplicate key errors
export const findOrCreateGroup = async (groupData: {
  name: string;
  description?: string;
  lead?: string;
  studentIds: string[];
}) => {
  try {
    // Try to create the group first
    const group = await createGroup({
      name: groupData.name,
      description: groupData.description || `${groupData.name} - Group project`,
      lead: groupData.lead,
      studentIds: groupData.studentIds,
      isActive: true
    });
    
    console.log('✅ Group created successfully:', group._id);
    return { group, created: true };
    
  } catch (error: any) {
    // Handle duplicate key error (E11000)
    if (error.code === 11000 && error.keyPattern?.name) {
      console.log('🔍 Group name already exists, fetching existing group...');
      
      // Find existing group
      const existingGroup = await Group.findOne({ name: groupData.name }).exec();
      
      if (existingGroup) {
        // Update existing group with new members if needed
        const currentStudentIds = existingGroup.studentIds || [];
        const newStudentIds = groupData.studentIds.filter(id => !currentStudentIds.includes(id));
        
        if (newStudentIds.length > 0) {
          await Group.findByIdAndUpdate(existingGroup._id, {
            $addToSet: { studentIds: { $each: newStudentIds } },
            updatedAt: new Date()
          });
          console.log(`✅ Added ${newStudentIds.length} new members to existing group`);
        }
        
        return { group: existingGroup, created: false };
      }
    }
    
    // Re-throw if it's a different error
    throw error;
  }
};

// Get all student IDs from a group (combines lead, members, and studentIds)
export const getAllGroupMemberIds = async (groupId: string) => {
  const group = await Group.findById(groupId).select('lead members studentIds').exec();
  if (!group) return [];
  
  const memberIds = new Set<string>();
  
  // Add lead
  if (group.lead) memberIds.add(group.lead.toString());
  
  // Add members (legacy)
  if (group.members && Array.isArray(group.members)) {
    group.members.forEach(member => member && memberIds.add(member.toString()));
  }
  
  // Add studentIds (primary)
  if (group.studentIds && Array.isArray(group.studentIds)) {
    group.studentIds.forEach(studentId => studentId && memberIds.add(studentId.toString()));
  }
  
  return Array.from(memberIds);
};

export const assignMentorToGroup = async (groupId: string, mentorId: string) => {
  return Group.findByIdAndUpdate(
    groupId, 
    { mentorId }, 
    { new: true }
  ).populate('mentorId').exec();
};

export default Group;
