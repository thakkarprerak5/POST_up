import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';
import { createMentorInvitation } from '@/models/MentorInvitation';

// POST /api/mentor/invitation - Send invitation from student to mentor
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle FormData (file upload with project creation)
    const formData = await request.formData();

    const mentorId = formData.get('mentorId') as string;
    const projectId = formData.get('projectId') as string;
    const projectTitle = formData.get('projectTitle') as string;
    const projectDescription = formData.get('projectDescription') as string;
    const proposalFile = formData.get('proposalFile') as File;
    const message = formData.get('message') as string;
    const registrationType = formData.get('registrationType') as string;
    const groupMemberEmails = formData.get('groupMemberEmails') as string;

    if (!mentorId || !projectTitle || !projectDescription || !proposalFile) {
      return NextResponse.json({ error: 'Mentor ID, project title, description, and proposal file are required' }, { status: 400 });
    }

    // Get student and mentor details first
    const student = await User.findOne({ email: session.user.email });
    const mentor = await User.findById(mentorId);

    if (!student || !mentor) {
      return NextResponse.json({ error: 'Student or Mentor not found' }, { status: 404 });
    }

    // Check if student is actually a student
    if (student.type !== 'student') {
      return NextResponse.json({ error: 'Only students can send invitations' }, { status: 403 });
    }

    // Check if mentor is actually a mentor or admin
    if (!['mentor', 'admin', 'super-admin'].includes(mentor.type)) {
      return NextResponse.json({ error: 'Selected user is not a mentor' }, { status: 400 });
    }

    // For group registration, validate group details
    let groupData: {
      lead: { id: string; name: string; email: string };
      members: { id?: string; name?: string; email: string; status: 'active' | 'pending' }[];
    } | null = null;
    if (registrationType === 'group') {
      console.log('🔍 Group member emails received:', groupMemberEmails);
      console.log('🔍 Type of groupMemberEmails:', typeof groupMemberEmails);

      if (!groupMemberEmails) {
        return NextResponse.json({ error: 'Group member emails are required for group registration' }, { status: 400 });
      }

      try {
        const emails = JSON.parse(groupMemberEmails);
        console.log('🔍 Parsed emails:', emails);

        if (!Array.isArray(emails) || emails.length < 1) {
          return NextResponse.json({ error: 'At least one group member email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of emails) {
          if (!emailRegex.test(email)) {
            return NextResponse.json({ error: `Invalid email format: ${email}` }, { status: 400 });
          }
        }

        // Find existing users and create pending members for non-registered emails
        const existingUsers = await User.find({
          email: { $in: emails }
        }).select('_id fullName email photo').exec();

        const processedGroupMembers = emails.map(email => {
          const existingUser = existingUsers.find(u => u.email === email);

          if (existingUser) {
            return {
              id: existingUser._id.toString(),
              name: existingUser.fullName,
              email: existingUser.email,
              status: 'active' as const
            };
          } else {
            return {
              email: email,
              status: 'pending' as const
            };
          }
        });

        // Create group data structure
        groupData = {
          lead: {
            id: student._id.toString(),
            name: student.fullName,
            email: student.email
          },
          members: processedGroupMembers
        };

        console.log('🔍 Group data created:', {
          lead: groupData.lead,
          memberCount: groupData.members.length,
          activeMembers: groupData.members.filter(m => m.status === 'active').length,
          pendingMembers: groupData.members.filter(m => m.status === 'pending').length
        });
      } catch (error) {
        console.error('❌ JSON Parse Error:', error);
        console.error('❌ Raw groupMemberEmails:', groupMemberEmails);
        return NextResponse.json({ error: 'Invalid group member emails format' }, { status: 400 });
      }
    }

    // Create project first
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const Project = db.collection('projects');
    const projectData = {
      title: projectTitle,
      description: projectDescription,
      author: student._id,
      authorName: student.fullName,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      images: [],
      likeCount: 0,
      commentsCount: 0,
      shareCount: 0,
      viewCount: 0,
      status: 'pending',
      registrationType: registrationType || 'individual',
      group: groupData,
      origin: 'project_registration', // Mark as project registration origin
      mentorAssigned: false // Track mentor assignment status
    };

    const projectResult = await Project.insertOne(projectData);
    const newProjectId = projectResult.insertedId.toString();

    // Handle file upload
    let proposalFilePath = '';
    if (proposalFile) {
      const bytes = await proposalFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create unique filename
      const timestamp = Date.now();
      const filename = `proposal-${timestamp}-${proposalFile.name}`;
      proposalFilePath = `/uploads/${filename}`;

      // Save file (you might need to adjust this based on your file storage setup)
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'public/uploads');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, filename), buffer);
    }

    // Check if invitation already exists
    const existingInvitation = await db
      .collection('mentorinvitations')
      .findOne({
        studentId: student._id.toString(),
        mentorId: mentorId,
        projectId: newProjectId,
        status: { $in: ['pending', 'accepted'] }
      });

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent or exists' }, { status: 400 });
    }

    // Create invitation using the correct model
    console.log('🔍 Creating invitation with data:', {
      mentorId: mentorId,
      studentId: student._id.toString(),
      projectId: newProjectId,
      projectTitle: projectTitle,
      projectDescription: projectDescription,
      proposalFile: proposalFilePath,
      message: message || '',
      status: 'pending',
      sentAt: new Date(),
      groupSnapshot: groupData
    });

    try {
      const invitation = await createMentorInvitation({
        mentorId: mentorId,
        studentId: student._id.toString(),
        projectId: newProjectId,
        projectTitle: projectTitle,
        projectDescription: projectDescription,
        proposalFile: proposalFilePath,
        message: message || '',
        status: 'pending',
        sentAt: new Date(),
        groupSnapshot: groupData
      });

      console.log('🔍 Created invitation result:', invitation);

      return NextResponse.json({
        message: 'Invitation sent successfully',
        invitation: {
          _id: invitation._id.toString(),
          studentId: {
            _id: student._id.toString(),
            fullName: student.fullName,
            email: student.email,
            photo: student.photo || '/placeholder-user.jpg'
          },
          projectId: {
            _id: newProjectId,
            title: projectTitle,
            createdAt: new Date()
          },
          projectTitle: projectTitle,
          projectDescription: projectDescription,
          proposalFile: proposalFilePath,
          message: message || '',
          status: 'pending',
          sentAt: new Date(),
          registrationType: registrationType || 'individual',
          group: groupData
        }
      });
    } catch (invitationError) {
      console.error('❌ Failed to create invitation:', invitationError);
      return NextResponse.json({
        error: 'Failed to create invitation',
        details: invitationError instanceof Error ? invitationError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Send invitation error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
