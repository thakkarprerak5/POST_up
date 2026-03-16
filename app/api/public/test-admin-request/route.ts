// app/api/public/test-admin-request/route.ts - Test API for creating admin assignment requests
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AdminAssignmentRequest from '@/models/AdminAssignmentRequest';
import User from '@/models/User';
import Project from '@/models/Project';

// POST /api/public/test-admin-request - Create test admin assignment request
export async function POST(request: NextRequest) {
  try {
    console.log('➕ Creating test admin assignment request...');
    
    await connectDB();

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

    // Get a test user (first student found)
    const testUser = await User.findOne({ type: 'student' });
    if (!testUser) {
      return NextResponse.json({ 
        error: 'No test student user found' 
      }, { status: 404 });
    }

    // Determine if this is individual or group project
    let requestedToType: 'student' | 'group' = 'student';
    let studentId = testUser._id.toString();
    let groupId = null;

    if (project.registrationType === 'group') {
      requestedToType = 'group';
      groupId = project.groupId;
      studentId = null;
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
      requestedBy: testUser._id.toString(),
      requestedToType,
      studentId,
      groupId
    });

    console.log('✅ Test admin assignment request created successfully');

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: 'Test admin assignment request created successfully'
    });
  } catch (error: any) {
    console.error('❌ Error creating test admin assignment request:', error);
    return NextResponse.json({ 
      error: 'Failed to create test admin assignment request', 
      details: error.message 
    }, { status: 500 });
  }
}
