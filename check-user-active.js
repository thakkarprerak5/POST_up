// Check user isActive field
const { MongoClient } = require('mongodb');

async function checkUserActiveField() {
  const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('post-up');
    const usersCollection = db.collection('users');
    
    // Get all users with their isActive field
    const users = await usersCollection.find({}).toArray();
    console.log(`\n👥 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || user.name || 'Unknown'} (${user.email})`);
      console.log(`   Type: ${user.type || 'student'}`);
      console.log(`   isActive: ${user.isActive}`);
      console.log(`   isBlocked: ${user.isBlocked}`);
      console.log('---');
    });
    
    // Count by isActive status
    const activeUsers = await usersCollection.countDocuments({ isActive: true });
    const inactiveUsers = await usersCollection.countDocuments({ isActive: false });
    const usersWithoutActiveField = await usersCollection.countDocuments({ isActive: { $exists: false } });
    
    console.log(`\n📊 Active Status Summary:`);
    console.log(`Active users (isActive: true): ${activeUsers}`);
    console.log(`Inactive users (isActive: false): ${inactiveUsers}`);
    console.log(`Users without isActive field: ${usersWithoutActiveField}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserActiveField();
