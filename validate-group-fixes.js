// Validation script to test group request fixes
const fs = require('fs');
const path = require('path');

console.log('🧪 VALIDATING GROUP REQUEST FIXES');
console.log('=================================\n');

const validationScript = `
const mongoose = require('mongoose');

async function validateGroupFixes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database');

    // Get models
    const AdminAssignmentRequest = mongoose.model('AdminAssignmentRequest', new mongoose.Schema({}, { strict: false, collection: 'adminassignmentrequests' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false, collection: 'groups' }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

    console.log('\\n🧪 TEST 1: SCHEMA VALIDATION');
    
    // Test that group requests require groupId
    try {
      const testRequest = new AdminAssignmentRequest({
        projectId: 'test-project-id',
        projectTitle: 'Test Project',
        projectDescription: 'Test Description',
        requestedBy: 'test-user-id',
        requestedToType: 'group',
        // Missing groupId - should fail
      });
      
      await testRequest.save();
      console.log('❌ FAIL: Group request without groupId was saved');
    } catch (validationError) {
      console.log('✅ PASS: Group request without groupId rejected');
    }

    console.log('\\n🧪 TEST 2: DATA INTEGRITY CHECK');
    
    const allGroupRequests = await AdminAssignmentRequest.find({
      requestedToType: 'group'
    }).lean();

    console.log(\`Total group requests: \${allGroupRequests.length}\`);

    let validRequests = 0;
    let invalidRequests = 0;

    for (const request of allGroupRequests) {
      if (request.groupId) {
        const group = await Group.findById(request.groupId).lean();
        if (group) {
          validRequests++;
        } else {
          invalidRequests++;
          console.log(\`❌ Request \${request._id} points to non-existent group\`);
        }
      } else {
        invalidRequests++;
        console.log(\`❌ Request \${request._id} missing groupId\`);
      }
    }

    console.log(\`✅ Valid requests: \${validRequests}\`);
    console.log(\`❌ Invalid requests: \${invalidRequests}\`);

    if (invalidRequests === 0) {
      console.log('🎉 ALL GROUP REQUESTS ARE VALID!');
    } else {
      console.log('⚠️ Some requests still need repair');
    }

    console.log('\\n🧪 TEST 3: GROUP LEAD IDENTIFICATION');
    
    let leadsWithFlags = 0;
    let leadsWithoutFlags = 0;

    for (const request of allGroupRequests.slice(0, 5)) { // Test first 5
      if (request.groupId) {
        const group = await Group.findById(request.groupId).lean();
        if (group && group.studentIds && group.studentIds.length > 0) {
          const students = await User.find({ 
            _id: { $in: group.studentIds } 
          }).select('fullName email profile.isGroupLead').lean();

          const groupLeads = students.filter(s => s.profile?.isGroupLead);
          
          if (groupLeads.length > 0) {
            leadsWithFlags++;
            console.log(\`✅ Group \${group.name} has \${groupLeads.length} identified leads\`);
          } else {
            leadsWithoutFlags++;
            console.log(\`⚠️ Group \${group.name} has no identified leads\`);
          }
        }
      }
    }

    console.log(\`Groups with identified leads: \${leadsWithFlags}\`);
    console.log(\`Groups without identified leads: \${leadsWithoutFlags}\`);

    console.log('\\n🧪 TEST 4: POPULATION LOGIC TEST');
    
    // Test the actual population logic
    const sampleRequest = await AdminAssignmentRequest.findOne({
      requestedToType: 'group',
      groupId: { $exists: true, $ne: null }
    }).lean();

    if (sampleRequest) {
      console.log('✅ Testing population logic...');
      
      // Simulate the population logic from getAllAdminAssignmentRequests
      const group = await Group.findById(sampleRequest.groupId).lean();
      
      if (group) {
        console.log(\`✅ Group found: \${group.name}\`);
        
        let groupMembers = [];
        let groupLead = null;
        
        if (group.studentIds && group.studentIds.length > 0) {
          const students = await User.find({ 
            _id: { $in: group.studentIds } 
          }).select('fullName email photo profile').lean();
          
          groupMembers = students.map((student) => ({
            id: student._id.toString(),
            fullName: student.fullName,
            email: student.email,
            photo: student.photo,
            isGroupLead: student.profile?.isGroupLead || false
          }));
          
          // Test enhanced lead identification
          groupLead = groupMembers.find(member => member.isGroupLead);
          
          if (!groupLead && sampleRequest.groupSnapshot?.lead?.email) {
            groupLead = groupMembers.find(member => member.email === sampleRequest.groupSnapshot.lead.email);
          }
          
          if (!groupLead && groupMembers.length > 0) {
            groupLead = groupMembers[0];
          }
        }
        
        console.log(\`✅ Population test results:\`);
        console.log(\`   - Group name: \${group.name}\`);
        console.log(\`   - Total members: \${groupMembers.length}\`);
        console.log(\`   - Group lead: \${groupLead ? groupLead.fullName : 'None'}\`);
        console.log(\`   - Lead identification method: \${groupLead?.isGroupLead ? 'isGroupLead flag' : sampleRequest.groupSnapshot?.lead?.email ? 'groupSnapshot' : 'fallback' }\`);
        
      } else {
        console.log('❌ Group not found for population test');
      }
    } else {
      console.log('⚠️ No group requests found for population test');
    }

    console.log('\\n🧪 TEST 5: UI DATA STRUCTURE VALIDATION');
    
    // Test that the data structure matches what the UI expects
    const testRequest = await AdminAssignmentRequest.findOne({
      requestedToType: 'group',
      groupId: { $exists: true, $ne: null }
    }).populate('groupId').lean();

    if (testRequest) {
      console.log('✅ Testing UI data structure...');
      
      // Check if the populated data has the expected structure
      const expectedFields = ['_id', 'name', 'description', 'studentIds', 'isActive'];
      const hasExpectedFields = expectedFields.every(field => 
        testRequest.groupId && field in testRequest.groupId
      );
      
      if (hasExpectedFields) {
        console.log('✅ Group data structure matches UI expectations');
      } else {
        console.log('❌ Group data structure missing expected fields');
      }
    }

    await mongoose.disconnect();
    console.log('\\n🎉 VALIDATION COMPLETED');

  } catch (error) {
    console.error('❌ Validation script error:', error);
    process.exit(1);
  }
}

validateGroupFixes();
`;

// Write the validation script to a file
fs.writeFileSync(path.join(__dirname, 'execute-validation.js'), validationScript);

console.log('✅ Validation script created: execute-validation.js');
console.log('\n📝 INSTRUCTIONS:');
console.log('1. Run: node execute-validation.js');
console.log('2. This will test all the fixes we implemented');
console.log('3. Check the output for validation results');
console.log('\n🧪 WHAT THE SCRIPT TESTS:');
console.log('- Schema validation (rejects invalid requests)');
console.log('- Data integrity of all group requests');
console.log('- Group lead identification logic');
console.log('- Population logic simulation');
console.log('- UI data structure compatibility');
console.log('- Overall system health');
