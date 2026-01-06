const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestAdmin() {
  await mongoose.connect('mongodb://localhost:27017/postup');
  const db = mongoose.connection.db;
  
  // Create a simple test admin
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testAdmin = {
    fullName: 'Test Admin',
    email: 'test@admin.com',
    password: hashedPassword,
    type: 'super_admin',
    profile: { type: 'mentor', joinedDate: new Date() },
    followers: [],
    following: [],
    followerCount: 0,
    followingCount: 0,
    isActive: true,
    isBlocked: false
  };
  
  // Delete if exists and create new
  await db.collection('users').deleteOne({ email: 'test@admin.com' });
  await db.collection('users').insertOne(testAdmin);
  
  console.log('✅ Test admin created!');
  console.log('Email: test@admin.com');
  console.log('Password: password123');
  
  mongoose.connection.close();
}

createTestAdmin();
