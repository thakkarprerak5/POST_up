const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function fixAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Update assignment with correct mentor ID (Ganpat SGSAB)
    const result = await db.collection('mentorassignments').updateOne(
      { _id: new ObjectId('6970791acfa52affff5eda1c') },
      { $set: { mentorId: '696a148fc3722c5eb7fa4bbb' } }
    );
    
    console.log('✅ Updated assignment with correct mentor ID:', result);
    
    // Verify the update
    const updated = await db.collection('mentorassignments').findOne({
      _id: new ObjectId('6970791acfa52affff5eda1c')
    });
    
    console.log('🔍 Final assignment:', {
      mentorId: updated.mentorId,
      studentId: updated.studentId,
      mentorName: 'Ganpat SGSAB (correct)',
      status: updated.status
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAssignment();
