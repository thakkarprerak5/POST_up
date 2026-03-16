
const mongoose = require('mongoose');

async function comprehensiveRepair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database');

    // Get models
    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false, collection: 'groups' }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

    console.log('\n🔍 STEP 1: FIND ALL BROKEN GROUP REQUESTS');
    
    const brokenRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group',
      $or: [
        { groupId: null },
        { groupId: { $exists: false } },
        { groupId: '' }
      ]
    }).lean();

    console.log(`Found ${brokenRequests.length} broken group requests to repair`);

    if (brokenRequests.length === 0) {
      console.log('✅ No broken requests found');
    } else {
      console.log('\n🔧 STEP 2: REPAIR EACH BROKEN REQUEST');
      
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

          let targetGroupId = null;

          // Method 1: Check if project already has a valid groupId
          if (project.groupId) {
            const existingGroup = await Group.findById(project.groupId).lean();
            if (existingGroup) {
              targetGroupId = project.groupId;
              console.log(`✅ Using existing project groupId: ${targetGroupId}`);
            } else {
              console.log(`⚠️ Project groupId points to non-existent group`);
            }
          }

          // Method 2: Create new group if no valid groupId found
          if (!targetGroupId) {
            console.log('🏢 Creating new Group document...');
            
            let studentIds = [];
            let groupName = `Group for ${project.title}`;
            let groupLeadEmail = null;

            // Extract group info from project.group or project.members
            if (project.group && project.group.members) {
              studentIds = project.group.members
                .filter(member => member.userId)
                .map(member => member.userId);
              groupName = project.group.name || groupName;
              groupLeadEmail = project.group.lead?.email;
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
            targetGroupId = newGroup._id.toString();
            console.log(`✅ Created Group: ${newGroup.name} (ID: ${targetGroupId})`);

            // Update project with new groupId
            await Project.updateOne(
              { _id: project._id },
              { groupId: targetGroupId }
            );
          }

          // Method 3: Mark group lead in User profile
          if (groupLeadEmail || project.authorId) {
            const leadEmail = groupLeadEmail || (await User.findById(project.authorId).select('email').lean())?.email;
            
            if (leadEmail) {
              await User.updateOne(
                { email: leadEmail },
                { 'profile.isGroupLead': true }
              );
              console.log(`✅ Marked group lead: ${leadEmail}`);
            }
          }

          // Update the request with the groupId
          await AdminAssignmentRequest.updateOne(
            { _id: request._id },
            { groupId: targetGroupId }
          );

          console.log(`✅ Updated request with groupId: ${targetGroupId}`);

        } catch (repairError) {
          console.error(`❌ Error repairing request ${request._id}:`, repairError);
        }
      }
    }

    console.log('\n🔍 STEP 3: VERIFY REPAIRS');
    
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

    console.log('\n🔍 STEP 4: VALIDATE GROUP LEAD FLAGS');
    
    // Check for group members who should be marked as leads
    const allGroupRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group',
      groupId: { $exists: true, $ne: null }
    }).lean();

    let leadFlagsUpdated = 0;

    for (const request of allGroupRequests) {
      if (request.groupSnapshot?.lead?.email) {
        const leadUser = await User.findOne({ email: request.groupSnapshot.lead.email }).select('_id profile.isGroupLead').lean();
        
        if (leadUser && !leadUser.profile?.isGroupLead) {
          await User.updateOne(
            { _id: leadUser._id },
            { 'profile.isGroupLead': true }
          );
          console.log(`✅ Updated lead flag for: ${request.groupSnapshot.lead.email}`);
          leadFlagsUpdated++;
        }
      }
    }

    console.log(`✅ Updated lead flags for ${leadFlagsUpdated} users`);

    console.log('\n🔍 STEP 5: FINAL VALIDATION');
    
    const validRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group',
      groupId: { $exists: true, $ne: null }
    }).lean();

    console.log(`✅ Total valid group requests: ${validRequests.length}`);
    
    let validWithGroups = 0;
    for (const request of validRequests) {
      const group = await Group.findById(request.groupId).lean();
      if (group) {
        validWithGroups++;
      }
    }

    console.log(`✅ Requests with valid groups: ${validWithGroups}`);

    await mongoose.disconnect();
    console.log('\n🎉 COMPREHENSIVE REPAIR COMPLETED');

  } catch (error) {
    console.error('❌ Repair script error:', error);
    process.exit(1);
  }
}

comprehensiveRepair();
