const mongoose = require('mongoose');
const { connectDB } = require('./lib/db');
const MentorAssignment = require('./models/MentorAssignment').default;
const MentorInvitation = require('./models/MentorInvitation').default;

async function debugAssignments() {
  try {
    await connectDB();
    console.log('🔍 === DEBUGGING MENTOR ASSIGNMENTS ===');
    
    // Check all mentor assignments
    const allAssignments = await MentorAssignment.find({}).populate('mentorId studentId').exec();
    console.log('📊 All mentor assignments:', allAssignments.length);
    allAssignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. Mentor: ${assignment.mentorId?.fullName || 'N/A'} (${assignment.mentorId?.email || 'N/A'}) -> Student: ${assignment.studentId?.fullName || 'N/A'} (${assignment.studentId?.email || 'N/A'}) - Status: ${assignment.status}`);
    });
    
    // Check all mentor invitations
    const allInvitations = await MentorInvitation.find({}).populate('mentorId studentId projectId').exec();
    console.log('📊 All mentor invitations:', allInvitations.length);
    allInvitations.forEach((invitation, index) => {
      console.log(`  ${index + 1}. ${invitation.status}: Mentor: ${invitation.mentorId?.fullName || 'N/A'} <- Student: ${invitation.studentId?.fullName || 'N/A'} for Project: ${invitation.projectId?.title || 'N/A'}`);
    });
    
    // Check specific student
    const targetStudentId = '6969da08df26fcd9f45af398';
    const studentAssignment = await MentorAssignment.findOne({ studentId: targetStudentId, status: 'active' }).populate('mentorId').exec();
    console.log('🎯 Assignment for target student:', studentAssignment);
    if (studentAssignment) {
      console.log('✅ Found mentor:', studentAssignment.mentorId.fullName, '(', studentAssignment.mentorId.email, ')');
    } else {
      console.log('❌ No assignment found for student');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

debugAssignments();
