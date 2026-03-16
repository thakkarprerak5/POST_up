// Direct repair endpoint - no auth required for emergency fix
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DIRECT EMERGENCY REPAIR API CALLED (NO AUTH)');
    
    await connectDB();

    // The 3 specific broken request IDs
    const brokenRequestIds = [
      '697706a9ab34cf7bdce74851', // Project: 'scac'
      '6973352fd0bd6747551a1c8d', // Project: 'fewe' 
      '6972037c6967adfa0f617b5b'  // Project: 'fewe'
    ];

    console.log('🔧 Starting repair of 3 broken group requests...');

    // Get collections directly
    const adminRequestsCollection = mongoose.connection.db.collection('adminassignmentrequests');
    const projectsCollection = mongoose.connection.db.collection('projects');
    const groupsCollection = mongoose.connection.db.collection('groups');

    let repairedCount = 0;
    let failedCount = 0;
    const repairResults = [];

    for (const requestId of brokenRequestIds) {
      console.log(`\n🔧 Repairing Request: ${requestId}`);
      
      try {
        // Get the broken request
        const request = await adminRequestsCollection.findOne({ _id: new mongoose.Types.ObjectId(requestId) });
        if (!request) {
          console.log(`   ❌ Request not found`);
          failedCount++;
          repairResults.push({ requestId, status: 'FAILED', error: 'Request not found' });
          continue;
        }

        console.log(`   📋 Project: ${request.projectTitle}`);
        console.log(`   📋 Project ID: ${request.projectId}`);

        // Get the project to recover groupId
        const project = await projectsCollection.findOne({ _id: new mongoose.Types.ObjectId(request.projectId) });
        if (!project) {
          console.log(`   ❌ Project not found - cannot recover`);
          failedCount++;
          repairResults.push({ requestId, status: 'FAILED', error: 'Project not found' });
          continue;
        }

        console.log(`   📋 Project found: ${project.title}`);
        console.log(`   📋 Project groupId: ${project.groupId || 'MISSING'}`);

        let groupId = null;
        let groupName = '';

        if (project.groupId) {
          // Try to use existing groupId from project
          const existingGroup = await groupsCollection.findOne({ _id: new mongoose.Types.ObjectId(project.groupId) });
          if (existingGroup) {
            groupId = project.groupId.toString();
            groupName = existingGroup.name;
            console.log(`   ✅ Using existing group: ${groupName}`);
          } else {
            console.log(`   ⚠️ Project groupId exists but Group document missing`);
          }
        }

        if (!groupId) {
          // Create a new group from project data
          console.log(`   🏢 Creating new group from project data...`);
          
          let studentIds = [];
          groupName = `Group for ${project.title}`;

          // Extract student IDs from project data
          if (project.group && project.group.members) {
            studentIds = project.group.members
              .filter((member: any) => member.userId)
              .map((member: any) => member.userId);
            if (project.group.name) {
              groupName = project.group.name;
            }
          } else if (project.members && Array.isArray(project.members)) {
            studentIds = project.members.filter((id: any) => id).map((id: any) => id.toString());
          }

          // Include project author
          if (project.authorId && !studentIds.includes(project.authorId.toString())) {
            studentIds.push(project.authorId.toString());
          }

          console.log(`   👥 Found ${studentIds.length} student IDs`);

          // Create the group
          const groupResult = await groupsCollection.insertOne({
            name: groupName,
            description: `Group for project: ${project.title}`,
            studentIds: studentIds,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          groupId = groupResult.insertedId.toString();
          
          console.log(`   ✅ Created group: ${groupName} (${studentIds.length} members)`);

          // Update project with new groupId
          await projectsCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(request.projectId) },
            { $set: { groupId: groupId } }
          );
          
          console.log(`   ✅ Updated project with groupId`);
        }

        // Update the request with the groupId
        await adminRequestsCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(requestId) },
          { $set: { groupId: groupId } }
        );

        console.log(`   ✅ Updated request with groupId: ${groupId}`);
        repairedCount++;
        repairResults.push({ 
          requestId, 
          status: 'FIXED', 
          projectTitle: request.projectTitle,
          groupName: groupName,
          groupId: groupId
        });

      } catch (repairError) {
        console.log(`   ❌ Repair failed: ${repairError.message}`);
        failedCount++;
        repairResults.push({ requestId, status: 'FAILED', error: repairError.message });
      }
    }

    console.log('\n🔍 FINAL VALIDATION');
    console.log('==================\n');

    // Validate the repairs
    const validationResults = [];
    for (const requestId of brokenRequestIds) {
      const request = await adminRequestsCollection.findOne({ _id: new mongoose.Types.ObjectId(requestId) });
      if (request && request.groupId) {
        const group = await groupsCollection.findOne({ _id: new mongoose.Types.ObjectId(request.groupId) });
        if (group) {
          console.log(`✅ Request ${requestId}: FIXED`);
          console.log(`   📋 Project: ${request.projectTitle}`);
          console.log(`   🏢 Group: ${group.name} (${group.studentIds?.length || 0} members)`);
          validationResults.push({ 
            requestId, 
            status: 'VALIDATED', 
            projectTitle: request.projectTitle,
            groupName: group.name,
            memberCount: group.studentIds?.length || 0
          });
        } else {
          console.log(`❌ Request ${requestId}: STILL BROKEN (Group not found)`);
          validationResults.push({ requestId, status: 'STILL_BROKEN', error: 'Group not found' });
        }
      } else {
        console.log(`❌ Request ${requestId}: STILL BROKEN (No groupId)`);
        validationResults.push({ requestId, status: 'STILL_BROKEN', error: 'No groupId' });
      }
    }

    console.log('\n📊 REPAIR SUMMARY');
    console.log('==================');
    console.log(`✅ Repaired: ${repairedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📋 Total processed: ${brokenRequestIds.length}`);

    const success = repairedCount === brokenRequestIds.length;

    return NextResponse.json({
      success: success,
      message: success ? 'All broken requests successfully repaired!' : `${failedCount} requests failed to repair`,
      summary: {
        repaired: repairedCount,
        failed: failedCount,
        total: brokenRequestIds.length
      },
      repairResults: repairResults,
      validationResults: validationResults,
      nextSteps: success ? [
        '1. Refresh the Admin Assignment Requests page',
        '2. The 3 broken requests should now show proper group data',
        '3. "Group Reference Missing" errors should be resolved',
        '4. Group names, leads, and members should display correctly'
      ] : [
        '1. Check the repair results for failed requests',
        '2. Manual intervention may be required for failed items'
      ]
    });

  } catch (error: any) {
    console.error('❌ Direct emergency repair API error:', error);
    return NextResponse.json({ 
      error: 'Direct emergency repair failed', 
      details: error.message 
    }, { status: 500 });
  }
}
