// Quick verification script to check if repair actually worked
const mongoose = require('mongoose');

async function verifyRepair() {
  try {
    await mongoose.connect('mongodb+srv://bhavythakkar1212:QhGp5s9uF8DvK2zE@cluster0.9a8xs.mongodb.net/postup?retryWrites=true&w=majority');
    console.log('🔗 Connected to database');

    const adminRequestsCollection = mongoose.connection.db.collection('adminassignmentrequests');
    const groupsCollection = mongoose.connection.db.collection('groups');

    console.log('\n🔍 VERIFYING REPAIR RESULTS');
    console.log('==========================\n');

    // Check the 3 specific requests
    const requestIds = [
      '697706a9ab34cf7bdce74851',
      '6973352fd0bd6747551a1c8d', 
      '6972037c6967adfa0f617b5b'
    ];

    for (const requestId of requestIds) {
      console.log(`\n📋 Checking Request: ${requestId}`);
      
      const request = await adminRequestsCollection.findOne({ _id: new mongoose.Types.ObjectId(requestId) });
      
      if (request) {
        console.log(`   ✅ Request found: ${request.projectTitle}`);
        console.log(`   📋 requestedToType: ${request.requestedToType}`);
        console.log(`   📋 groupId: ${request.groupId || 'MISSING'}`);
        
        if (request.groupId) {
          const group = await groupsCollection.findOne({ _id: new mongoose.Types.ObjectId(request.groupId) });
          if (group) {
            console.log(`   ✅ Group found: ${group.name}`);
            console.log(`   👥 Members: ${group.studentIds?.length || 0}`);
            console.log(`   📅 Created: ${group.createdAt}`);
          } else {
            console.log(`   ❌ Group NOT found for groupId: ${request.groupId}`);
          }
        } else {
          console.log(`   ❌ Still missing groupId`);
        }
      } else {
        console.log(`   ❌ Request NOT found`);
      }
    }

    // Check all group requests
    console.log('\n📊 ALL GROUP REQUESTS STATUS');
    console.log('==========================\n');
    
    const allGroupRequests = await adminRequestsCollection.find({ requestedToType: 'group' }).toArray();
    
    allGroupRequests.forEach((req, index) => {
      const status = req.groupId ? '✅ FIXED' : '❌ BROKEN';
      const groupInfo = req.groupId ? `(${req.groupId})` : '(MISSING)';
      console.log(`${index + 1}. ${status} ${req.projectTitle} ${groupInfo}`);
    });

    await mongoose.disconnect();
    console.log('\n🎯 VERIFICATION COMPLETED');

  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

verifyRepair();
