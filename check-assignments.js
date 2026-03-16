const mongoose = require('mongoose');
const { connectDB } = require('./lib/db.js');

async function checkAssignments() {
  try {
    await connectDB();
    const MentorAssignment = mongoose.model('MentorAssignment');
    const assignments = await MentorAssignment.find({}).populate('mentorId', 'fullName email').populate('studentId', 'fullName email').exec();
    console.log('📊 Current Mentor Assignments:', assignments.length);
    assignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. Mentor: ${assignment.mentorId?.fullName} (${assignment.mentorId?.email}) -> Student: ${assignment.studentId?.fullName} (${assignment.studentId?.email})`);
      console.log(`     Status: ${assignment.status}, Type: ${assignment.assignedToType}`);
    });
    
    // Also check invitations
    const MentorInvitation = mongoose.model('MentorInvitation');
    const invitations = await MentorInvitation.find({}).populate('mentorId', 'fullName email').populate('studentId', 'fullName email').exec();
    console.log('\n📨 Current Mentor Invitations:', invitations.length);
    invitations.forEach((invitation, index) => {
      console.log(`  ${index + 1}. Student: ${invitation.studentId?.fullName} -> Mentor: ${invitation.mentorId?.fullName}`);
      console.log(`     Status: ${invitation.status}, Project: ${invitation.projectTitle}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}
checkAssignments();
