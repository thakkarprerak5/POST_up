const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    
    // Drop existing admin user if exists
    const db = mongoose.connection.db;
    await db.collection('users').deleteOne({ email: 'admin@postup.com' });
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user with proper schema structure
    const adminUser = {
      fullName: 'Admin User',
      email: 'admin@postup.com',
      password: hashedPassword,
      photo: '/placeholder-user.jpg',
      type: 'super_admin',
      profile: {
        type: 'mentor', // Required field
        joinedDate: new Date(),
        bio: 'System Administrator',
        department: 'IT',
        position: 'System Administrator'
      },
      followers: [],
      following: [],
      followerCount: 0,
      followingCount: 0,
      isActive: true,
      isBlocked: false
    };
    
    // Insert the user
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@postup.com');
    console.log('Password: admin123');
    console.log('Role: super_admin');
    console.log('User ID:', result.insertedId);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.connection.close();
  }
}

createAdmin();
