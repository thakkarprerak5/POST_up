// Alternative repair script that works through your Node.js application
// Run this with: node repair-through-api.js

const mongoose = require('mongoose');

async function repairThroughAPI() {
  try {
    // Use the same connection as your app
    await mongoose.connect('mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database through Node.js');

    // Define schemas dynamically
    const AdminAssignmentRequestSchema = new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' });
    const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
    const GroupSchema = new mongoose.Schema({}, { strict: false, collection: 'groups' });

    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', AdminAssignmentRequestSchema);
    const Project = mongoose.model('Project', ProjectSchema);
    const Group = mongoose.model('Group', GroupSchema);

    console.log('\n🔧 REPAIRING 3 BROKEN GROUP REQUESTS');
    console.log('=====================================\n');

    // The 3 specific broken request IDs
    const brokenRequestIds = [
      '697706a9ab34cf7bdce74851', // Project: 'scac'
      '6973352fd0bd6747551a1c8d', // Project: 'fewe' 
      '6972037c6967adfa0f617b5b'  // Project: 'fewe'
    ];

    let repairedCount = 0;
    let failedCount = 0;

    for (const requestId of brokenRequestIds) {
      console.log(`\n🔧 Repairing Request: ${requestId}`);
      
      try {
        // Get the broken request
        const request = await AdminAssignmentRequest.findById(requestId);
        if (!request) {
          console.log(`   ❌ Request not found`);
          failedCount++;
          continue;
        }

        console.log(`   📋 Project: ${request.projectTitle}`);
        console.log(`   📋 Project ID: ${request.projectId}`);

        // Get the project to recover groupId
        const project = await Project.findById(request.projectId);
        if (!project) {
          console.log(`   ❌ Project not found - cannot recover`);
          failedCount++;
          continue;
        }

        console.log(`   📋 Project found: ${project.title}`);
        console.log(`   📋 Project groupId: ${project.groupId || 'MISSING'}`);
        console.log(`   📋 Project registrationType: ${project.registrationType}`);

        let groupId = null;
        let groupName = '';

        if (project.groupId) {
          // Try to use existing groupId from project
          const existingGroup = await Group.findById(project.groupId);
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
              .filter(member => member.userId)
              .map(member => member.userId);
            if (project.group.name) {
              groupName = project.group.name;
            }
          } else if (project.members && Array.isArray(project.members)) {
            studentIds = project.members.filter(id => id).map(id => id.toString());
          }

          // Include project author
          if (project.authorId && !studentIds.includes(project.authorId.toString())) {
            studentIds.push(project.authorId.toString());
          }

          console.log(`   👥 Found ${studentIds.length} student IDs`);

          // Create the group
          const newGroup = new Group({
            name: groupName,
            description: `Group for project: ${project.title}`,
            studentIds: studentIds,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await newGroup.save();
          groupId = newGroup._id.toString();
          
          console.log(`   ✅ Created group: ${groupName} (${studentIds.length} members)`);

          // Update project with new groupId
          await Project.updateOne(
            { _id: project._id },
            { groupId: groupId }
          );
          
          console.log(`   ✅ Updated project with groupId`);
        }

        // Update the request with the groupId
        await AdminAssignmentRequest.updateOne(
          { _id: requestId },
          { groupId: groupId }
        );

        console.log(`   ✅ Updated request with groupId: ${groupId}`);
        repairedCount++;

      } catch (repairError) {
        console.log(`   ❌ Repair failed: ${repairError.message}`);
        failedCount++;
      }
    }

    console.log('\n🔍 FINAL VALIDATION');
    console.log('==================\n');

    // Validate the repairs
    for (const requestId of brokenRequestIds) {
      const request = await AdminAssignmentRequest.findById(requestId);
      if (request && request.groupId) {
        const group = await Group.findById(request.groupId);
        if (group) {
          console.log(`✅ Request ${requestId}: FIXED`);
          console.log(`   📋 Project: ${request.projectTitle}`);
          console.log(`   🏢 Group: ${group.name} (${group.studentIds?.length || 0} members)`);
        } else {
          console.log(`❌ Request ${requestId}: STILL BROKEN (Group not found)`);
        }
      } else {
        console.log(`❌ Request ${requestId}: STILL BROKEN (No groupId)`);
      }
    }

    console.log('\n📊 REPAIR SUMMARY');
    console.log('==================');
    console.log(`✅ Repaired: ${repairedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📋 Total processed: ${brokenRequestIds.length}`);

    if (repairedCount === brokenRequestIds.length) {
      console.log('\n🎉 ALL BROKEN REQUESTS SUCCESSFULLY REPAIRED!');
      console.log('\n📝 NEXT STEPS:');
      console.log('1. Stop the current npm run dev process (Ctrl+C)');
      console.log('2. Restart npm run dev');
      console.log('3. Refresh the Admin Assignment Requests page');
      console.log('4. The 3 broken requests should now show proper group data');
      console.log('5. "Group Reference Missing" errors should be resolved');
    } else {
      console.log(`\n⚠️ ${failedCount} requests still need manual attention`);
    }

    await mongoose.disconnect();
    console.log('\n🎯 REPAIR COMPLETED');

  } catch (error) {
    console.error('❌ Repair script error:', error);
    process.exit(1);
  }
}

repairThroughAPI();
