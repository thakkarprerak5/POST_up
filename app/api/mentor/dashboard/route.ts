import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Project from '@/models/Project';
import mongoose from 'mongoose';
import {
  getMentorAssignmentsForDashboard
} from '@/models/MentorAssignment';

// GET /api/mentor/dashboard - Get mentor's assigned students and groups (PRIVATE)
export async function GET(request: NextRequest) {
  console.log('🚀 Private Mentor Dashboard API called');

  try {
    await connectDB();
    console.log('✅ Database connected');

    // Check if user is authenticated and is a mentor
    const session = await getServerSession(authOptions);
    console.log('🔐 Session found:', !!session);

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

    // Verify user is a mentor or admin
    if (!['mentor', 'admin', 'super-admin'].includes(currentUser.type)) {
      return NextResponse.json(
        { error: 'Access denied. Only mentors and admins can access this endpoint.' },
        { status: 403 }
      );
    }

    console.log('🎯 Mentor Dashboard API: Fetching data for mentor:', currentUser.fullName);

    // Get all assignments for this mentor using raw MongoDB query for better control
    const MentorAssignment = mongoose.model('MentorAssignment');

    const allAssignments = await MentorAssignment.find({
      mentorId: currentUser._id.toString(),
      status: 'active'
    })
      .populate('studentId', 'fullName email photo')
      .populate({
        path: 'groupId',
        strictPopulate: false, // ADD THIS BYPASS
        select: 'name description lead studentIds members',
        populate: [
          {
            path: 'lead', // CORRECT: Use 'lead' not 'groupLead'
            strictPopulate: false,
            select: 'fullName email photo type'
          },
          {
            path: 'studentIds', // CORRECT: Use 'studentIds' not 'members'
            strictPopulate: false,
            select: 'fullName email photo type'
          }
        ]
      })
      .populate('projectId', 'title')
      .sort({ assignedAt: -1 })
      .exec();

    console.log(`📊 Found ${allAssignments.length} total assignments`);

    // CRUCIAL TRANSFORMATION: Separate assignments into two distinct arrays
    const studentAssignments = allAssignments.filter(a =>
      a.assignedToType === 'student' && a.studentId
    );

    const groupAssignments = allAssignments.filter(a =>
      a.assignedToType === 'group' && a.groupId
    );

    console.log(`📊 Separated into ${studentAssignments.length} student assignments and ${groupAssignments.length} group assignments`);

    // ENHANCE: Fetch project details for individual assignments
    const enrichedStudentAssignments = await Promise.all(studentAssignments.map(async (studentAssignment) => {
      try {
        // Fetch project details if projectId exists
        let projectDetails = null;
        if (studentAssignment.projectId) {
          projectDetails = await Project.findById(studentAssignment.projectId)
            .select('title description createdAt tags images')
            .exec();
        }

        return {
          ...studentAssignment.toObject(),
          project: projectDetails ? {
            id: projectDetails._id.toString(),
            title: projectDetails.title,
            description: projectDetails.description,
            tags: projectDetails.tags,
            images: projectDetails.images,
            createdAt: projectDetails.createdAt
          } : null
        };
      } catch (error) {
        console.error('Error enriching student assignment:', error);
        return studentAssignment.toObject(); // Return original assignment if enrichment fails
      }
    }));

    // ENHANCE: Fetch project details for group assignments
    const enrichedGroupAssignments = await Promise.all(groupAssignments.map(async (groupAssignment) => {
      try {
        // Fetch project details if projectId exists
        let projectDetails = null;
        if (groupAssignment.projectId) {
          projectDetails = await Project.findById(groupAssignment.projectId)
            .select('title description createdAt tags images')
            .exec();
        }

        return {
          ...groupAssignment.toObject(),
          project: projectDetails ? {
            id: projectDetails._id.toString(),
            title: projectDetails.title,
            description: projectDetails.description,
            tags: projectDetails.tags,
            images: projectDetails.images,
            createdAt: projectDetails.createdAt
          } : null
        };
      } catch (error) {
        console.error('Error enriching group assignment:', error);
        return groupAssignment.toObject(); // Return original assignment if enrichment fails
      }
    }));

    // Return the separated arrays as requested
    return NextResponse.json({
      success: true,
      mentor: {
        id: currentUser._id,
        name: currentUser.fullName,
        email: currentUser.email,
        photo: currentUser.photo,
        type: currentUser.type
      },
      students: enrichedStudentAssignments, // Separate students array
      groups: enrichedGroupAssignments,    // Separate groups array
      summary: {
        totalStudents: studentAssignments.length,
        totalGroups: groupAssignments.length,
        totalAssignments: allAssignments.length
      },
      // Permission flags for frontend
      permissions: {
        canManageAssignments: true, // This is the mentor's own dashboard
        canRemoveStudents: true,
        canRemoveGroups: true,
        isOwnProfile: true
      },
      // Private API flag for frontend
      isPublicView: false
    });

  } catch (error) {
    console.error('❌ Error in GET /api/mentor/dashboard:', error);

    // Ensure we always return JSON, even on error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
