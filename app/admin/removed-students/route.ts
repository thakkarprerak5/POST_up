import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import MentorAssignment from '@/models/MentorAssignment';
import User from '@/models/User';
import Group from '@/models/Group';

// GET /api/admin/removed-students - Fetch removed students/groups awaiting reassignment
export async function GET(request: NextRequest) {
  console.log('🔍 GET removed students API called');
  
  try {
    await connectDB();
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    // Find current user from database
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is admin or super-admin
    if (!['admin', 'super-admin'].includes(currentUser.type)) {
      return NextResponse.json(
        { error: 'Access denied. Only admins can view removed students.' },
        { status: 403 }
      );
    }

    console.log('✅ Admin access verified for:', currentUser.fullName);

    // Find all assignments with removalReason = 'other' (awaiting reassignment)
    // Also include completed and report_issue assignments for admin visibility
    const removedAssignments = await MentorAssignment.find({
      status: { $in: ['removed', 'completed'] },
      removalReason: { $exists: true, $ne: null }
    })
      .populate('mentorId', 'fullName email photo')
      .populate('studentId', 'fullName email photo')
      .populate('groupId', 'name description')
      .populate('assignedBy', 'fullName email')
      .populate('removedBy', 'fullName email')
      .populate('completedBy', 'fullName email')
      .sort({ removedAt: -1, completedAt: -1 })
      .exec();

    console.log('🔍 Found removed assignments:', removedAssignments.length);

    // Also find users/groups with awaiting_reassignment status
    const awaitingReassignmentUsers = await User.find({
      status: 'awaiting_reassignment'
    })
      .select('fullName email photo previousMentorId removalReason removedAt')
      .exec();

    const awaitingReassignmentGroups = await Group.find({
      status: 'awaiting_reassignment'
    })
      .select('name description previousMentorId removalReason removedAt')
      .exec();

    console.log('🔍 Found awaiting reassignment:', {
      users: awaitingReassignmentUsers.length,
      groups: awaitingReassignmentGroups.length
    });

    // Process and combine data
    const processedAssignments = removedAssignments.map(assignment => {
      const processed = assignment.toObject();
      
      // Add project information if available
      if (assignment.projectId) {
        processed.projectId = assignment.projectId;
      }
      
      return processed;
    });

    // Calculate stats
    const stats = {
      total: processedAssignments.length,
      project_completed: processedAssignments.filter(a => a.removalReason === 'project_completed').length,
      report_issue: processedAssignments.filter(a => a.removalReason === 'report_issue').length,
      other: processedAssignments.filter(a => a.removalReason === 'other').length,
      awaiting_reassignment: awaitingReassignmentUsers.length + awaitingReassignmentGroups.length
    };

    return NextResponse.json({
      success: true,
      assignments: processedAssignments,
      stats: stats,
      awaitingReassignment: {
        users: awaitingReassignmentUsers,
        groups: awaitingReassignmentGroups
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/removed-students:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
