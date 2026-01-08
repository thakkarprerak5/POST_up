// Fix users without isActive field
const { MongoClient } = require('mongodb');

async function fixUserActiveField() {
  const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('post-up');
    const usersCollection = db.collection('users');
    
    // Find users without isActive field
    const usersWithoutActive = await usersCollection.find({ isActive: { $exists: false } }).toArray();
    console.log(`\n🔧 Found ${usersWithoutActive.length} users without isActive field:`);
    
    if (usersWithoutActive.length > 0) {
      // Update all users without isActive field to set it to true
      const result = await usersCollection.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true, isBlocked: false } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} users to have isActive: true`);
      
      // Verify the update
      const activeUsers = await usersCollection.countDocuments({ isActive: true });
      const inactiveUsers = await usersCollection.countDocuments({ isActive: false });
      const usersWithoutActiveField = await usersCollection.countDocuments({ isActive: { $exists: false } });
      
      console.log(`\n📊 Updated Status Summary:`);
      console.log(`Active users (isActive: true): ${activeUsers}`);
      console.log(`Inactive users (isActive: false): ${inactiveUsers}`);
      console.log(`Users without isActive field: ${usersWithoutActiveField}`);
    } else {
      console.log('✅ All users already have isActive field');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixUserActiveField();
