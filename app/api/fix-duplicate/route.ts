// Fix the remaining duplicate group name issue
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FIXING DUPLICATE GROUP NAME ISSUE');
    
    await connectDB();

    // The remaining broken request ID
    const requestId = '6972037c6967adfa0f617b5b';

    // Get collections
    const adminRequestsCollection = mongoose.connection.db.collection('adminassignmentrequests');
    const projectsCollection = mongoose.connection.db.collection('projects');
    const groupsCollection = mongoose.connection.db.collection('groups');

    console.log(`🔧 Fixing Request: ${requestId}`);
    
    // Get the broken request
    const request = await adminRequestsCollection.findOne({ _id: new mongoose.Types.ObjectId(requestId) });
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    console.log(`📋 Project: ${request.projectTitle}`);

    // Get the project
    const project = await projectsCollection.findOne({ _id: new mongoose.Types.ObjectId(request.projectId) });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create a unique group name using timestamp
    const uniqueGroupName = `Group for ${project.title} - ${Date.now()}`;
    
    let studentIds = [];

    // Extract student IDs from project data
    if (project.group && project.group.members) {
      studentIds = project.group.members
        .filter((member: any) => member.userId)
        .map((member: any) => member.userId);
    } else if (project.members && Array.isArray(project.members)) {
      studentIds = project.members.filter((id: any) => id).map((id: any) => id.toString());
    }

    // Include project author
    if (project.authorId && !studentIds.includes(project.authorId.toString())) {
      studentIds.push(project.authorId.toString());
    }

    console.log(`👥 Found ${studentIds.length} student IDs`);

    // Create the group with unique name
    const groupResult = await groupsCollection.insertOne({
      name: uniqueGroupName,
      description: `Group for project: ${project.title}`,
      studentIds: studentIds,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const groupId = groupResult.insertedId.toString();
    
    console.log(`✅ Created group: ${uniqueGroupName} (${studentIds.length} members)`);

    // Update project with new groupId
    await projectsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(request.projectId) },
      { $set: { groupId: groupId } }
    );
    
    console.log(`✅ Updated project with groupId`);

    // Update the request with the groupId
    await adminRequestsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(requestId) },
      { $set: { groupId: groupId } }
    );

    console.log(`✅ Updated request with groupId: ${groupId}`);

    // Validate the repair
    const updatedRequest = await adminRequestsCollection.findOne({ _id: new mongoose.Types.ObjectId(requestId) });
    const group = await groupsCollection.findOne({ _id: new mongoose.Types.ObjectId(groupId) });

    return NextResponse.json({
      success: true,
      message: 'Successfully fixed the remaining broken request',
      requestId: requestId,
      projectTitle: request.projectTitle,
      groupName: uniqueGroupName,
      groupId: groupId,
      memberCount: group.studentIds?.length || 0,
      validation: {
        hasGroupId: !!updatedRequest.groupId,
        groupExists: !!group,
        groupMemberCount: group.studentIds?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Fix duplicate error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix duplicate issue', 
      details: error.message 
    }, { status: 500 });
  }
}
