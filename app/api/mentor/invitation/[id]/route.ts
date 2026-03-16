import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';

// PUT /api/mentor/invitation - Accept or reject invitation
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitationId, action } = await request.json();

    if (!invitationId || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get mentor details
    const mentor = await User.findOne({ email: session.user.email });

    if (!mentor || !['mentor', 'admin', 'super-admin'].includes(mentor.type)) {
      return NextResponse.json({ error: 'Only mentors and admins can respond to invitations' }, { status: 403 });
    }

    // Get invitation
    const invitation = await mongoose.connection.db
      .collection('mentorinvitations')
      .findOne({ _id: new mongoose.Types.ObjectId(invitationId) });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this invitation is for this mentor
    if (invitation.mentorId !== mentor._id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update invitation status
    const updateData = {
      status: action === 'accept' ? 'accepted' : 'rejected',
      updatedAt: new Date(),
      respondedAt: new Date()
    };

    const result = await mongoose.connection.db
      .collection('mentorinvitations')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(invitationId) },
        { $set: updateData }
      );

    if (action === 'accept') {
      // Create mentor assignment if accepted
      const assignment = {
        mentorId: mentor._id.toString(),
        studentId: invitation.studentId,
        assignedToType: 'student',
        assignedBy: mentor._id.toString(), // Mentor assigned themselves
        assignedAt: new Date(),
        status: 'active'
      };

      await mongoose.connection.db
        .collection('mentorassignments')
        .insertOne(assignment);
    }

    return NextResponse.json({
      message: `Invitation ${action}ed successfully`,
      action,
      invitation: {
        id: invitationId,
        status: action === 'accept' ? 'accepted' : 'rejected',
        respondedAt: updateData.respondedAt
      }
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    return NextResponse.json({ error: 'Failed to respond to invitation' }, { status: 500 });
  }
}

// GET /api/mentor/invitation - Get mentor's invitations
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get mentor details
    const mentor = await User.findOne({ email: session.user.email });

    if (!mentor || !['mentor', 'admin', 'super-admin'].includes(mentor.type)) {
      return NextResponse.json({ error: 'Only mentors and admins can view invitations' }, { status: 403 });
    }

    // Get mentor's invitations
    const invitations = await mongoose.connection.db
      .collection('mentorinvitations')
      .find({ mentorId: mentor._id.toString() })
      .sort({ createdAt: -1 })
      .toArray();

    // Get student and project details for each invitation
    const studentIds = [...new Set(invitations.map(i => i.studentId))];
    const projectIds = [...new Set(invitations.map(i => i.projectId))];

    const students = await User.find({
      _id: { $in: studentIds },
      type: 'student'
    })
      .select('_id fullName email photo')
      .lean()
      .exec();

    const projects = await mongoose.connection.db
      .collection('projects')
      .find({ _id: { $in: projectIds.map(id => new mongoose.Types.ObjectId(id)) } })
      .toArray();

    const studentMap = students.reduce((acc, student) => {
      acc[student._id.toString()] = student;
      return acc;
    }, {});

    const projectMap = projects.reduce((acc, project) => {
      acc[project._id.toString()] = project;
      return acc;
    }, {});

    // Format invitations with full details
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation._id.toString(),
      student: studentMap[invitation.studentId] || null,
      project: projectMap[invitation.projectId] || null,
      message: invitation.message,
      status: invitation.status,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      respondedAt: invitation.respondedAt
    }));

    return NextResponse.json({
      invitations: formattedInvitations,
      stats: {
        total: invitations.length,
        pending: invitations.filter(i => i.status === 'pending').length,
        accepted: invitations.filter(i => i.status === 'accepted').length,
        rejected: invitations.filter(i => i.status === 'rejected').length
      }
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json({ error: 'Failed to get invitations' }, { status: 500 });
  }
}
