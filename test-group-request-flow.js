// Test script to verify the complete group request flow
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING GROUP REQUEST FLOW');
console.log('=============================\n');

const testScript = `
const mongoose = require('mongoose');

async function testGroupRequestFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database');

    // Get models
    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false, collection: 'groups' }));

    console.log('\\n🧪 STEP 1: Test Schema Validation');
    
    // Test 1: Try to create a group request without groupId (should fail)
    try {
      const testRequest = new AdminAssignmentRequest({
        projectId: 'test-project-id',
        projectTitle: 'Test Project',
        projectDescription: 'Test Description',
        requestedBy: 'test-user-id',
        requestedToType: 'group',
        // Missing groupId - should fail validation
      });
      
      await testRequest.save();
      console.log('❌ UNEXPECTED: Group request without groupId was saved (validation failed)');
    } catch (validationError) {
      console.log('✅ EXPECTED: Group request without groupId was rejected');
      console.log('   Error:', validationError.message);
    }

    console.log('\\n🧪 STEP 2: Test Valid Group Request Creation');
    
    // Test 2: Create a valid group request
    try {
      // First create a test group
      const testGroup = new Group({
        name: 'Test Group',
        description: 'Test group for validation',
        studentIds: [],
        isActive: true
      });
      await testGroup.save();
      console.log('✅ Created test group:', testGroup._id);

      // Now create a valid group request
      const validRequest = new AdminAssignmentRequest({
        projectId: 'test-project-id',
        projectTitle: 'Test Project',
        projectDescription: 'Test Description',
        requestedBy: 'test-user-id',
        requestedToType: 'group',
        groupId: testGroup._id.toString(), // Valid groupId
      });
      
      await validRequest.save();
      console.log('✅ Valid group request created successfully');
      
      // Clean up
      await AdminAssignmentRequest.deleteOne({ _id: validRequest._id });
      await Group.deleteOne({ _id: testGroup._id });
      
    } catch (error) {
      console.log('❌ UNEXPECTED: Valid group request failed');
      console.log('   Error:', error.message);
    }

    console.log('\\n🧪 STEP 3: Check Existing Data Integrity');
    
    // Test 3: Check existing requests for data integrity
    const allRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group'
    }).lean();

    console.log(\`Found \${allRequests.length} group requests total\`);

    let validRequests = 0;
    let invalidRequests = 0;

    for (const request of allRequests) {
      if (request.groupId) {
        // Check if the group actually exists
        const group = await Group.findById(request.groupId).lean();
        if (group) {
          validRequests++;
        } else {
          invalidRequests++;
          console.log(\`❌ Request \${request._id} points to non-existent group \${request.groupId}\`);
        }
      } else {
        invalidRequests++;
        console.log(\`❌ Request \${request._id} missing groupId\`);
      }
    }

    console.log(\`\\n📊 DATA INTEGRITY SUMMARY:\`);
    console.log(\`   Valid group requests: \${validRequests}\`);
    console.log(\`   Invalid group requests: \${invalidRequests}\`);
    
    if (invalidRequests === 0) {
      console.log('✅ ALL GROUP REQUESTS ARE VALID!');
    } else {
      console.log('⚠️ SOME REQUESTS NEED REPAIR - run execute-repair.js');
    }

    console.log('\\n🧪 STEP 4: Test Population Logic');
    
    // Test 4: Test the getAllAdminAssignmentRequests function
    try {
      // Import the actual function (this would need to be adapted based on your setup)
      // For now, we'll simulate what it does
      
      const sampleRequest = await AdminAssignmentRequest.findOne({
        requestedToType: 'group',
        groupId: { $exists: true, $ne: null }
      }).lean();

      if (sampleRequest) {
        console.log('✅ Found sample group request for population test');
        
        // Test population
        const group = await Group.findById(sampleRequest.groupId).lean();
        if (group) {
          console.log('✅ Group population successful');
          console.log(\`   Group name: \${group.name}\`);
          console.log(\`   Member count: \${group.studentIds?.length || 0}\`);
        } else {
          console.log('❌ Group population failed');
        }
      } else {
        console.log('⚠️ No group requests found for population test');
      }
      
    } catch (error) {
      console.log('❌ Population test failed:', error.message);
    }

    await mongoose.disconnect();
    console.log('\\n🎉 Testing completed');

  } catch (error) {
    console.error('❌ Test script error:', error);
    process.exit(1);
  }
}

testGroupRequestFlow();
`;

// Write the test script to a file
fs.writeFileSync(path.join(__dirname, 'execute-test.js'), testScript);

console.log('✅ Test script created: execute-test.js');
console.log('\n📝 INSTRUCTIONS:');
console.log('1. Run: node execute-test.js');
console.log('2. This will test schema validation and data integrity');
console.log('3. Check the console output for test results');
console.log('\n🧪 WHAT THE SCRIPT TESTS:');
console.log('- Schema validation (rejects invalid requests)');
console.log('- Valid request creation');
console.log('- Data integrity of existing requests');
console.log('- Population logic');
console.log('- Overall system health');
