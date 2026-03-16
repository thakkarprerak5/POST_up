import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MentorInvitation from '@/models/MentorInvitation';
import Project from '@/models/Project';

// GET /api/mentors/supervised-projects?mentorId=xxx
export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const mentorId = url.searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching supervised projects for mentor:', mentorId);

    // Find accepted invitations to get supervised projects
    const acceptedInvitations = await MentorInvitation.find({
      mentorId: mentorId,
      status: 'accepted'
    })
    .populate('studentId', 'fullName email photo')
    .populate('projectId', 'title description images tags createdAt likeCount commentsCount')
    .sort({ respondedAt: -1 })
    .exec();

    console.log('🔍 Accepted invitations found:', acceptedInvitations.length);

    // Transform the data for the frontend
    const supervisedProjects = acceptedInvitations.map(invitation => ({
      id: invitation.projectId._id,
      title: invitation.projectId.title,
      description: invitation.projectId.description,
      image: invitation.projectId.images?.[0] || '/placeholder.svg',
      images: invitation.projectId.images || [],
      tags: invitation.projectId.tags || [],
      studentName: invitation.studentId.fullName,
      studentEmail: invitation.studentId.email,
      studentPhoto: invitation.studentId.photo,
      mentorId: invitation.mentorId,
      invitationId: invitation._id,
      acceptedAt: invitation.respondedAt,
      createdAt: invitation.projectId.createdAt,
      proposalFile: invitation.proposalFile, // Add proposal file from invitation
      likeCount: invitation.projectId.likeCount || 0,
      commentsCount: invitation.projectId.commentsCount || 0,
      // Permissions for the mentor
      permissions: {
        canEdit: true,
        canUpdateDescription: true,
        canManageFiles: true,
        canDelete: false // Cannot delete entire project
      }
    }));

    console.log('🔍 Supervised projects prepared:', supervisedProjects.length);

    return NextResponse.json({
      success: true,
      projects: supervisedProjects,
      count: supervisedProjects.length
    });

  } catch (error: any) {
    console.error('GET /api/mentors/supervised-projects error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
