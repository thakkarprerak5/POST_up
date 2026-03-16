const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function fixAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Update the assignment to include assignedToType
    const result = await db.collection('mentorassignments').updateOne(
      { _id: new ObjectId('6970791acfa52affff5eda1c') },
      { $set: { assignedToType: 'student' } }
    );
    
    console.log('✅ Updated assignment:', result);
    
    // Verify the update
    const updated = await db.collection('mentorassignments').findOne({
      _id: new ObjectId('6970791acfa52affff5eda1c')
    });
    
    console.log('🔍 Updated assignment:', updated);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAssignment();
