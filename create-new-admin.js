const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createNewAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    
    const adminData = {
      fullName: 'Admin User',
      email: 'admin@postup.com',
      password: 'admin123', // Change this in production!
      type: 'super_admin',
      isActive: true,
      isBlocked: false,
      profile: {
        type: 'mentor', // Admins need a profile type
        joinedDate: new Date(),
        bio: 'System Administrator',
        department: 'IT',
        position: 'System Administrator'
      },
      followers: [],
      following: [],
      followerCount: 0,
      followingCount: 0
    };
    
    const admin = new User(adminData);
    await admin.save();
    
    console.log('✅ New admin user created:');
    console.log('Email:', admin.email);
    console.log('Password: admin123 (CHANGE IN PRODUCTION!)');
    console.log('Role:', admin.type);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

createNewAdmin();
