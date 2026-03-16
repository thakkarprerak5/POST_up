const mongoose = require('mongoose');

async function inspectRequest() {
  try {
    // Use the MongoDB URI directly from .env.local content
    const mongoUri = "mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority";
    
    await mongoose.connect(mongoUri);
    console.log('🔍 Connected to database');
    
    // Get the AdminAssignmentRequest model
    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' }));
    const requestId = '6976f9ebab34cf7bdce74264';
    
    console.log('\n📋 Looking for AdminAssignmentRequest with ID:', requestId);
    
    const request = await AdminAssignmentRequest.findById(requestId).lean();
    
    if (!request) {
      console.log('❌ Request not found');
      
      // Let's check if there are any requests at all
      console.log('\n🔍 Checking all requests...');
      const allRequests = await AdminAssignmentRequest.find({}).limit(5).lean();
      console.log(`Found ${allRequests.length} requests total`);
      if (allRequests.length > 0) {
        console.log('Sample request IDs:', allRequests.map(r => r._id));
      }
      return;
    }
    
    console.log('\n✅ Found request - Full document structure:');
    console.log(JSON.stringify(request, null, 2));
    
    console.log('\n🔍 Key fields analysis:');
    console.log('- _id:', request._id);
    console.log('- projectId:', request.projectId);
    console.log('- requestedToType:', request.requestedToType);
    console.log('- groupId:', request.groupId);
    console.log('- groupSnapshot exists:', !!request.groupSnapshot);
    
    if (request.projectId) {
      console.log('\n🔍 Checking associated project...');
      const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
      const project = await Project.findById(request.projectId).lean();
      if (project) {
        console.log('✅ Project found:');
        console.log('- title:', project.title);
        console.log('- registrationType:', project.registrationType);
        console.log('- groupId:', project.groupId);
        console.log('- group exists:', !!project.group);
      } else {
        console.log('❌ Project not found');
      }
    }
    
    if (request.groupId) {
      console.log('\n🔍 Checking associated group...');
      const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false, collection: 'groups' }));
      const group = await Group.findById(request.groupId).lean();
      if (group) {
        console.log('✅ Group found:');
        console.log('- name:', group.name);
        console.log('- studentIds:', group.studentIds);
        console.log('- isActive:', group.isActive);
      } else {
        console.log('❌ Group not found - groupId points to non-existent group');
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectRequest();
