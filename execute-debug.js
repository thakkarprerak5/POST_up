
const mongoose = require('mongoose');

async function debugGroupRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database');

    // Get models
    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false, collection: 'groups' }));

    console.log('\n📋 STEP 1: INSPECT ALL ADMIN ASSIGNMENT REQUESTS');
    
    const allRequests = await AdminAssignmentRequest.find({}).lean();
    console.log(`Total requests: ${allRequests.length}`);

    const groupRequests = allRequests.filter(r => r.requestedToType === 'group');
    console.log(`Group requests: ${groupRequests.length}`);

    if (groupRequests.length === 0) {
      console.log('❌ No group requests found');
      await mongoose.disconnect();
      return;
    }

    console.log('\n🔍 STEP 2: ANALYZE EACH GROUP REQUEST');
    
    for (let i = 0; i < groupRequests.length; i++) {
      const request = groupRequests[i];
      console.log(`\n--- Group Request ${i + 1} ---`);
      console.log('ID:', request._id);
      console.log('Project Title:', request.projectTitle);
      console.log('Requested To Type:', request.requestedToType);
      console.log('Group ID:', request.groupId);
      console.log('Has GroupId:', !!request.groupId);
      console.log('Group Snapshot:', !!request.groupSnapshot);
      
      if (request.groupSnapshot) {
        console.log('  - Group Lead:', request.groupSnapshot.lead?.name);
        console.log('  - Group Members:', request.groupSnapshot.members?.length || 0);
      }

      // Check associated project
      if (request.projectId) {
        const project = await Project.findById(request.projectId).lean();
        if (project) {
          console.log('✅ Project Found:');
          console.log('  - Title:', project.title);
          console.log('  - Registration Type:', project.registrationType);
          console.log('  - Project GroupId:', project.groupId);
          console.log('  - Has Group Object:', !!project.group);
          
          if (project.group) {
            console.log('  - Group Lead:', project.group.lead?.name);
            console.log('  - Group Members:', project.group.members?.length || 0);
          }
        } else {
          console.log('❌ Project NOT FOUND');
        }
      }

      // Check associated group
      if (request.groupId) {
        const group = await Group.findById(request.groupId).lean();
        if (group) {
          console.log('✅ Group Found:');
          console.log('  - Name:', group.name);
          console.log('  - Description:', group.description);
          console.log('  - Student IDs:', group.studentIds?.length || 0);
          console.log('  - Is Active:', group.isActive);
        } else {
          console.log('❌ Group NOT FOUND - GroupId points to non-existent group');
        }
      } else {
        console.log('❌ NO GROUP ID - This is the root cause!');
      }
    }

    console.log('\n📊 STEP 3: SUMMARY ANALYSIS');
    
    const validGroupRequests = [];
    const invalidGroupRequests = [];
    
    for (const request of groupRequests) {
      if (request.groupId) {
        const group = await Group.findById(request.groupId).lean();
        if (group) {
          validGroupRequests.push(request);
        } else {
          invalidGroupRequests.push({
            ...request,
            issue: 'GroupId points to non-existent group'
          });
        }
      } else {
        invalidGroupRequests.push({
          ...request,
          issue: 'Missing GroupId'
        });
      }
    }

    console.log(`✅ Valid group requests: ${validGroupRequests.length}`);
    console.log(`❌ Invalid group requests: ${invalidGroupRequests.length}`);

    if (invalidGroupRequests.length > 0) {
      console.log('\n🔧 REPAIR NEEDED FOR:');
      invalidGroupRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.projectTitle} - ${req.issue}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n🎯 DEBUGGING COMPLETE');

  } catch (error) {
    console.error('❌ Debug script error:', error);
    process.exit(1);
  }
}

debugGroupRequests();
