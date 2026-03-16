const mongoose = require('mongoose');

async function simpleDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const studentId = '696a148fc3722c5eb7fa4bbc';
    
    // Check if the collection exists and has data
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections:', collections.map(c => c.name));
    
    // Check raw collection data
    const rawAssignments = await db.collection('mentorassignments').find({}).toArray();
    console.log('📊 Raw collection data count:', rawAssignments.length);
    
    // Query exactly like the API should
    const assignment = await db.collection('mentorassignments').findOne({
      studentId: studentId,
      status: 'active'
    });
    
    console.log('🔍 Direct collection query result:', assignment);
    
    // Try with ObjectId conversion
    const { ObjectId } = mongoose.Types;
    const assignmentWithObjectId = await db.collection('mentorassignments').findOne({
      studentId: studentId,
      status: 'active'
    });
    
    console.log('🔍 Query with ObjectId check:', assignmentWithObjectId);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

simpleDebug();
