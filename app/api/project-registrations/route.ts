import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { ProjectRegistration } from '@/models/ProjectRegistration';
import AdminAssignmentRequest from '@/models/AdminAssignmentRequest';
import Project from '@/models/Project';
import Group from '@/models/Group';

// POST /api/project-registrations - Create new project registration
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      registrationType,
      mentorAssignmentMethod,
      projectTitle,
      projectDescription,
      proposalUrl,
      proposalFileName,
      groupName,
      groupMemberEmails // Updated to accept emails instead of member objects
    } = body;

    // Validate required fields
    if (!registrationType || !mentorAssignmentMethod || !projectTitle || !projectDescription || !proposalUrl || !proposalFileName) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // For group registration, validate group details
    if (registrationType === 'group') {
      if (!groupName) {
        return NextResponse.json({ error: 'Group name is required for group registration' }, { status: 400 });
      }
      if (!groupMemberEmails || groupMemberEmails.length < 1) {
        return NextResponse.json({ error: 'At least one group member email is required' }, { status: 400 });
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of groupMemberEmails) {
        if (!emailRegex.test(email)) {
          return NextResponse.json({ error: `Invalid email format: ${email}` }, { status: 400 });
        }
      }
    }

    const User = mongoose.models.User;

    // Verify user is student or group lead
    const user = await User.findById(session.user.id);
    if (!user || (user.type !== 'student' && !user.profile?.isGroupLead)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Process group member emails for group registration
    let processedGroupMembers = [];
    let groupData = null;

    if (registrationType === 'group') {
      console.log('👥 Processing group member emails:', groupMemberEmails);
      
      // Find existing users and create pending members for non-registered emails
      const existingUsers = await User.find({ 
        email: { $in: groupMemberEmails } 
      }).select('_id fullName email photo').exec();

      const existingEmails = new Set(existingUsers.map(u => u.email));
      
      processedGroupMembers = groupMemberEmails.map(email => {
        const existingUser = existingUsers.find(u => u.email === email);
        
        if (existingUser) {
          return {
            userId: existingUser._id.toString(),
            email: existingUser.email,
            name: existingUser.fullName,
            status: 'active'
          };
        } else {
          return {
            email: email,
            status: 'pending' // Not registered yet
          };
        }
      });

      // Create group data structure
      groupData = {
        lead: {
          id: session.user.id,
          name: user.fullName,
          email: user.email
        },
        members: processedGroupMembers
      };

      // 🔴 CRITICAL: Mark the group lead in their profile
      await User.updateOne(
        { _id: session.user.id },
        { 'profile.isGroupLead': true }
      );
      console.log('✅ Marked user as group lead:', user.email);

      console.log('✅ Group data created:', {
        lead: groupData.lead,
        memberCount: groupData.members.length,
        activeMembers: groupData.members.filter(m => m.status === 'active').length,
        pendingMembers: groupData.members.filter(m => m.status === 'pending').length
      });
    }

    // Create project registration
    const registration = new ProjectRegistration({
      registrationType,
      mentorAssignmentMethod,
      projectTitle,
      projectDescription,
      proposalUrl,
      proposalFileName,
      registeredBy: session.user.id,
      mentorId: mentorAssignmentMethod === 'admin' ? null : undefined,
      status: mentorAssignmentMethod === 'admin' ? 'pending_mentor' : 'draft',
      submittedAt: new Date(),
      // Group-specific fields
      groupName: registrationType === 'group' ? groupName : undefined,
      groupMembers: registrationType === 'group' ? processedGroupMembers : undefined,
      isGroupLead: registrationType === 'group' ? true : false
    });

    await registration.save();

    // If admin assignment method is selected, create a project and admin assignment request
    if (mentorAssignmentMethod === 'admin') {
      try {
        let actualGroupId = undefined;
        
        // For group projects, create an actual Group document
        if (registrationType === 'group') {
          console.log('🏢 Creating Group document for group project...');
          
          // Extract student IDs from processed group members
          const studentIds = processedGroupMembers
            .filter(member => member.userId) // Only include registered users
            .map(member => member.userId);
          
          // Create the Group document
          const groupDocument = new Group({
            name: groupName,
            description: `Group for project: ${projectTitle}`,
            studentIds: studentIds,
            isActive: true
          });
          
          await groupDocument.save();
          actualGroupId = groupDocument._id.toString();
          
          console.log('✅ Group document created:', {
            groupId: actualGroupId,
            groupName: groupName,
            memberCount: studentIds.length
          });
        }

        // Create the project
        const project = new Project({
          title: projectTitle,
          description: projectDescription,
          proposalFile: proposalUrl,
          registrationType,
          authorId: session.user.id,
          status: 'pending_mentor',
          createdAt: new Date(),
          updatedAt: new Date(),
          // Enhanced group structure
          group: groupData,
          // Legacy fields (for backward compatibility)
          groupId: actualGroupId, // Now points to actual Group document
          members: registrationType === 'group' ? processedGroupMembers.map((member: any) => member.userId || member.email) : [session.user.id]
        });

        await project.save();

        // Create admin assignment request with correct groupId
        const adminRequest = await AdminAssignmentRequest.createAdminAssignmentRequest({
          projectId: project._id.toString(),
          projectTitle: project.title,
          projectDescription: project.description,
          proposalFile: project.proposalFile,
          requestedBy: session.user.id,
          requestedToType: registrationType === 'group' ? 'group' : 'student',
          studentId: registrationType === 'individual' ? session.user.id : undefined,
          groupId: actualGroupId, // Now points to actual Group document
          // Include group snapshot for group requests
          groupSnapshot: groupData
        });

        console.log('✅ Admin assignment request created for project:', project.title);
        console.log('✅ Request ID:', adminRequest._id);
        console.log('✅ Group ID in request:', actualGroupId);

      } catch (projectError) {
        console.error('Error creating project/admin request:', projectError);
        // Don't fail the whole registration if the admin request creation fails
        // The project registration is still successful
      }
    }

    return NextResponse.json({
      message: 'Project registration submitted successfully',
      registration: {
        id: registration._id,
        registrationType,
        projectTitle,
        status: registration.status,
        submittedAt: registration.submittedAt,
        mentorAssignmentMethod
      },
      adminRequestCreated: mentorAssignmentMethod === 'admin',
      adminRequestMessage: mentorAssignmentMethod === 'admin' 
        ? 'Your admin assignment request has been created and will be reviewed by the Super Admin.'
        : undefined
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project registration:', error);
    return NextResponse.json(
      { error: 'Failed to create registration' }, 
      { status: 500 }
    );
  }
}
