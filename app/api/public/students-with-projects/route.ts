import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MentorInvitation from '@/models/MentorInvitation';
import Project from '@/models/Project';
import User from '@/models/User';

// GET /api/public/students-with-projects - Get students with projects that have accepted mentor invitations (no auth required)
export async function GET() {
  try {
    console.log('🚀 Starting public students-with-projects API call...');
    
    await connectDB();

    // Get all accepted mentor invitations - this is our single source of truth
    const acceptedInvitations = await MentorInvitation.find({ 
      status: 'accepted' 
    })
    .populate('mentorId', 'fullName email photo')
    .populate('studentId', 'fullName email photo')
    .populate('groupId', 'name description')
    .populate('projectId', 'title proposalFile createdAt')
    .sort({ respondedAt: -1 })
    .exec();

    console.log(`📊 Found ${acceptedInvitations.length} accepted invitations`);

    // Process each accepted invitation into the required format
    const studentsWithProjects = await Promise.all(
      acceptedInvitations.map(async (invitation) => {
        try {
          // Get full project details
          const project = await Project.findById(invitation.projectId._id)
            .select('title description proposalFile createdAt tags')
            .lean();

          // Determine if this is individual or group project
          const isGroupProject = !!invitation.groupId;
          
          // Get student/group information
          let studentGroupInfo;
          if (isGroupProject && invitation.groupId) {
            // Get group members for group projects
            const groupMembers = await User.find({ 
              groupId: invitation.groupId._id.toString() 
            })
            .select('fullName email photo')
            .lean()
            .exec();
            
            studentGroupInfo = {
              type: 'group',
              name: invitation.groupId.name,
              members: groupMembers.map(member => ({
                fullName: member.fullName,
                email: member.email,
                photo: member.photo
              }))
            };
          } else {
            // Individual student
            studentGroupInfo = {
              type: 'individual',
              name: invitation.studentId.fullName,
              email: invitation.studentId.email,
              photo: invitation.studentId.photo
            };
          }

          return {
            id: invitation._id.toString(),
            studentGroupInfo,
            projectInfo: {
              title: project?.title || invitation.projectTitle,
              description: project?.description || invitation.projectDescription,
              proposalFile: project?.proposalFile || invitation.proposalFile,
              projectId: invitation.projectId._id.toString(),
              createdAt: project?.createdAt || invitation.sentAt,
              tags: project?.tags || []
            },
            mentorInfo: {
              name: invitation.mentorId.fullName,
              email: invitation.mentorId.email,
              photo: invitation.mentorId.photo,
              assignmentSource: 'Assigned via accepted invitation',
              assignedAt: invitation.respondedAt
            }
          };
        } catch (error) {
          console.error('Error processing invitation:', error);
          return null;
        }
      })
    );

    // Filter out null entries and sort by assignment date
    const validStudentsWithProjects = studentsWithProjects
      .filter(item => item !== null)
      .sort((a, b) => new Date(b.mentorInfo.assignedAt).getTime() - new Date(a.mentorInfo.assignedAt).getTime());

    console.log(`✅ Processed ${validStudentsWithProjects.length} valid student-project entries`);

    return NextResponse.json({ 
      students: validStudentsWithProjects,
      total: validStudentsWithProjects.length,
      stats: {
        totalInvitations: acceptedInvitations.length,
        individualProjects: validStudentsWithProjects.filter(item => item.studentGroupInfo.type === 'individual').length,
        groupProjects: validStudentsWithProjects.filter(item => item.studentGroupInfo.type === 'group').length
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching students with projects:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch students with projects', 
      details: error.message 
    }, { status: 500 });
  }
}
