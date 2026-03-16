// app/api/student/admin-assignment-request/route.ts - Student creates admin assignment request
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';
import AdminAssignmentRequest from '@/models/AdminAssignmentRequest';
import User from '@/models/User';
import Project from '@/models/Project';
import Group from '@/models/Group';

// POST /api/student/admin-assignment-request - Create admin assignment request
export async function POST(request: NextRequest) {
  try {
    console.log('➕ Student creating admin assignment request...');
    
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: session.user.email }).exec();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const requestData = await request.json();
    console.log('📝 Request data:', requestData);

    // Validate required fields
    if (!requestData.projectId) {
      return NextResponse.json({ 
        error: 'Missing required field: projectId' 
      }, { status: 400 });
    }

    // Get project details
    const project = await Project.findById(requestData.projectId);
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found' 
      }, { status: 404 });
    }

    // Check if user owns this project or is a member of the group
    let isAuthorized = false;
    let requestedToType: 'student' | 'group' = 'student';
    let studentId = currentUser._id.toString();
    let groupId = null;

    if (project.registrationType === 'individual') {
      // Individual project - check if user is the author
      if (project.authorId.toString() === currentUser._id.toString()) {
        isAuthorized = true;
        requestedToType = 'student';
        studentId = currentUser._id.toString();
      }
    } else if (project.registrationType === 'group') {
      // Group project - check if user is a member
      if (project.members && project.members.some((member: any) => member.toString() === currentUser._id.toString())) {
        isAuthorized = true;
        requestedToType = 'group';
        
        // 🔴 CRITICAL: Validate groupId exists and is valid
        if (!project.groupId) {
          return NextResponse.json({ 
            error: 'Project is missing groupId - cannot create group mentor request. Please contact administrator.' 
          }, { status: 400 });
        }
        
        // Verify the Group document actually exists
        const groupExists = await Group.findById(project.groupId);
        if (!groupExists) {
          return NextResponse.json({ 
            error: 'Group reference is invalid - cannot create group mentor request. Please contact administrator.' 
          }, { status: 400 });
        }
        
        groupId = project.groupId;
        studentId = null;
        
        console.log('✅ Validated group reference:', {
          projectId: project._id,
          groupId: groupId,
          groupName: groupExists.name,
          memberCount: groupExists.studentIds?.length || 0
        });
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'You are not authorized to create an admin assignment request for this project' 
      }, { status: 403 });
    }

    // Prepare group snapshot data for group requests
    let groupSnapshot = null;
    if (requestedToType === 'group' && project.group) {
      groupSnapshot = {
        lead: {
          id: project.group.lead?.id || '',
          name: project.group.lead?.name || '',
          email: project.group.lead?.email || ''
        },
        members: project.group.members || []
      };
    }

    // Check if there's already a pending request for this project
    const existingRequest = await AdminAssignmentRequest.findOne({
      projectId: requestData.projectId,
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'There is already a pending admin assignment request for this project' 
      }, { status: 409 });
    }

    // Create the admin assignment request
    const newRequest = await AdminAssignmentRequest.createAdminAssignmentRequest({
      projectId: project._id.toString(),
      projectTitle: project.title,
      projectDescription: project.description || '',
      proposalFile: project.proposalFile,
      requestedBy: currentUser._id.toString(),
      requestedToType,
      studentId,
      groupId,
      groupSnapshot
    });

    console.log('✅ Admin assignment request created successfully');

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: 'Admin assignment request created successfully'
    });
  } catch (error: any) {
    console.error('❌ Error creating admin assignment request:', error);
    return NextResponse.json({ 
      error: 'Failed to create admin assignment request', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/student/admin-assignment-request - Get student's admin assignment requests
export async function GET() {
  try {
    console.log('🔍 Getting student admin assignment requests...');
    
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: session.user.email }).exec();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get student's admin assignment requests
    const requests = await AdminAssignmentRequest.getAdminAssignmentRequestsByStudent(
      currentUser._id.toString()
    );

    console.log(`✅ Found ${requests.length} admin assignment requests for student`);

    return NextResponse.json({
      requests,
      total: requests.length,
      stats: {
        pending: requests.filter(r => r.status === 'pending').length,
        assigned: requests.filter(r => r.status === 'assigned').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length
      }
    });
  } catch (error: any) {
    console.error('❌ Error getting student admin assignment requests:', error);
    return NextResponse.json({ 
      error: 'Failed to get admin assignment requests', 
      details: error.message 
    }, { status: 500 });
  }
}
