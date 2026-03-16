import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

// DELETE /api/admin/clean-assignments - Clear all mentor assignments and invitations
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🧹 STARTING COMPLETE MENTOR ASSIGNMENT CLEANUP');
    
    // Get the models
    const MentorAssignment = mongoose.model('MentorAssignment');
    const MentorInvitation = mongoose.model('MentorInvitation');
    
    // Count before deletion
    const assignmentsCountBefore = await MentorAssignment.countDocuments();
    const invitationsCountBefore = await MentorInvitation.countDocuments();
    
    console.log(`📊 Found ${assignmentsCountBefore} mentor assignment records before cleanup`);
    console.log(`📊 Found ${invitationsCountBefore} mentor invitation records before cleanup`);
    
    // Delete all mentor assignment documents
    const assignmentDeleteResult = await MentorAssignment.deleteMany({});
    console.log(`🗑️ Deleted ${assignmentDeleteResult.deletedCount} mentor assignment records`);
    
    // Delete all mentor invitation documents for complete clean slate
    const invitationDeleteResult = await MentorInvitation.deleteMany({});
    console.log(`🗑️ Deleted ${invitationDeleteResult.deletedCount} mentor invitation records`);
    
    // Verify deletion
    const assignmentsCountAfter = await MentorAssignment.countDocuments();
    const invitationsCountAfter = await MentorInvitation.countDocuments();
    
    console.log(`📊 ${assignmentsCountAfter} mentor assignment records remain after cleanup`);
    console.log(`📊 ${invitationsCountAfter} mentor invitation records remain after cleanup`);
    
    return NextResponse.json({
      success: true,
      message: "All MentorAssignments and MentorInvitations have been deleted.",
      deletedAssignments: assignmentDeleteResult.deletedCount,
      deletedInvitations: invitationDeleteResult.deletedCount,
      assignmentsBefore: assignmentsCountBefore,
      assignmentsAfter: assignmentsCountAfter,
      invitationsBefore: invitationsCountBefore,
      invitationsAfter: invitationsCountAfter,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up mentor assignments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clean up mentor assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/clean-assignments - Check current state before cleanup
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔍 CHECKING MENTOR ASSIGNMENT STATE BEFORE CLEANUP');
    
    // Get the models
    const MentorAssignment = mongoose.model('MentorAssignment');
    const MentorInvitation = mongoose.model('MentorInvitation');
    
    // Count all documents
    const assignmentsCount = await MentorAssignment.countDocuments();
    const invitationsCount = await MentorInvitation.countDocuments();
    
    // Get sample of assignments to debug
    const sampleAssignments = await MentorAssignment.find({})
      .limit(5)
      .select('mentorId assignedToType studentId groupId assignedAt status')
      .lean();
    
    // Get sample of invitations to debug
    const sampleInvitations = await MentorInvitation.find({})
      .limit(5)
      .select('mentorId studentId groupId projectId status')
      .lean();
    
    console.log(`📊 Total mentor assignments: ${assignmentsCount}`);
    console.log(`📊 Total mentor invitations: ${invitationsCount}`);
    console.log('📊 Sample assignments:', sampleAssignments);
    console.log('📊 Sample invitations:', sampleInvitations);
    
    return NextResponse.json({
      success: true,
      assignmentsCount,
      invitationsCount,
      sampleAssignments,
      sampleInvitations,
      message: 'Current state before cleanup',
      readyForCleanup: assignmentsCount > 0 || invitationsCount > 0
    });
    
  } catch (error) {
    console.error('❌ Error checking mentor assignments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check mentor assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
