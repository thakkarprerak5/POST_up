const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function updateAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Update assignment to use the currently logged-in mentor
    const result = await db.collection('mentorassignments').updateOne(
      { _id: new ObjectId('6970791acfa52affff5eda1c') },
      { $set: { mentorId: '6932becc696e13382a825371' } }
    );
    
    console.log('✅ Updated assignment to current logged-in mentor:', result);
    
    // Verify the update
    const updated = await db.collection('mentorassignments').findOne({
      _id: new ObjectId('6970791acfa52affff5eda1c')
    });
    
    console.log('🔍 Updated assignment:', {
      mentorId: updated.mentorId,
      studentId: updated.studentId,
      status: updated.status
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAssignment();
