// Simple script to check user status
const mongoose = require('mongoose');

// MongoDB connection string - you'll need to update this
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/post_up';

async function checkUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Count all users
    const totalUsers = await usersCollection.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);
    
    // Count active users
    const activeUsers = await usersCollection.countDocuments({ isActive: true });
    console.log(`Active users: ${activeUsers}`);
    
    // Count inactive users
    const inactiveUsers = await usersCollection.countDocuments({ isActive: false });
    console.log(`Inactive users: ${inactiveUsers}`);
    
    // Get all user details
    const users = await usersCollection.find({}).toArray();
    console.log('\nUser details:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName || user.name} (${user.email})`);
      console.log(`   Type: ${user.type}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Blocked: ${user.isBlocked}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
