
const mongoose = require('mongoose');

async function repairBrokenRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database');

    // Get models
    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false, collection: 'groups' }));

    // Step 1: Find all broken group requests
    console.log('\n🔍 STEP 1: Finding broken group requests...');
    const brokenRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group',
      $or: [
        { groupId: null },
        { groupId: { $exists: false } },
        { groupId: '' }
      ]
    }).lean();

    console.log(`Found ${brokenRequests.length} broken group requests`);

    if (brokenRequests.length === 0) {
      console.log('✅ No broken requests found');
      await mongoose.disconnect();
      return;
    }

    // Step 2: Repair each broken request
    for (const request of brokenRequests) {
      console.log(`\n🔧 Repairing request: ${request._id} - ${request.projectTitle}`);

      try {
        // Find the associated project
        const project = await Project.findById(request.projectId).lean();
        if (!project) {
          console.log(`❌ Project not found for request ${request._id}`);
          continue;
        }

        console.log(`✅ Found project: ${project.title} (registrationType: ${project.registrationType})`);

        // Check if project already has a groupId
        if (project.groupId) {
          console.log(`✅ Project already has groupId: ${project.groupId}`);
          
          // Verify the group exists
          const existingGroup = await Group.findById(project.groupId).lean();
          if (existingGroup) {
            console.log(`✅ Group exists: ${existingGroup.name}`);
            
            // Update the request with the existing groupId
            await AdminAssignmentRequest.updateOne(
              { _id: request._id },
              { groupId: project.groupId }
            );
            console.log(`✅ Updated request with existing groupId`);
            continue;
          } else {
            console.log(`⚠️ Project groupId points to non-existent group`);
          }
        }

        // Create a new Group document
        console.log('🏢 Creating new Group document...');
        
        let studentIds = [];
        let groupName = `Group for ${project.title}`;

        // Extract group info from project.group or project.members
        if (project.group && project.group.members) {
          studentIds = project.group.members
            .filter(member => member.userId)
            .map(member => member.userId);
          groupName = project.group.name || groupName;
        } else if (project.members && Array.isArray(project.members)) {
          studentIds = project.members.filter(id => id).map(id => id.toString());
        }

        // Include the project author as group member
        if (project.authorId && !studentIds.includes(project.authorId.toString())) {
          studentIds.push(project.authorId.toString());
        }

        const newGroup = new Group({
          name: groupName,
          description: `Group for project: ${project.title}`,
          studentIds: studentIds,
          isActive: true
        });

        await newGroup.save();
        console.log(`✅ Created Group: ${newGroup.name} (ID: ${newGroup._id})`);

        // Update both project and request with the new groupId
        await Project.updateOne(
          { _id: project._id },
          { groupId: newGroup._id.toString() }
        );

        await AdminAssignmentRequest.updateOne(
          { _id: request._id },
          { groupId: newGroup._id.toString() }
        );

        console.log(`✅ Updated project and request with new groupId`);

      } catch (repairError) {
        console.error(`❌ Error repairing request ${request._id}:`, repairError);
      }
    }

    // Step 3: Verify repairs
    console.log('\n🔍 STEP 3: Verifying repairs...');
    const stillBrokenRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group',
      $or: [
        { groupId: null },
        { groupId: { $exists: false } },
        { groupId: '' }
      ]
    }).lean();

    if (stillBrokenRequests.length === 0) {
      console.log('✅ All requests repaired successfully!');
    } else {
      console.log(`⚠️ Still have ${stillBrokenRequests.length} broken requests`);
    }

    await mongoose.disconnect();
    console.log('\n🎉 Repair process completed');

  } catch (error) {
    console.error('❌ Repair script error:', error);
    process.exit(1);
  }
}

repairBrokenRequests();
