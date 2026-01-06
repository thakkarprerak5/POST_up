// This script creates an admin user using the exact same model structure as the auth system
const mongoose = require('mongoose');

async function createAdminWithCorrectModel() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    
    // First, clear any existing admin
    const db = mongoose.connection.db;
    await db.collection('users').deleteOne({ email: 'admin@postup.com' });
    
    // Create user with the exact structure the TypeScript model expects
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      fullName: 'Admin User',
      email: 'admin@postup.com',
      password: hashedPassword,
      photo: '/placeholder-user.jpg',
      type: 'super_admin',
      profile: {
        type: 'mentor',
        joinedDate: new Date(),
        bio: 'System Administrator',
        department: 'IT',
        position: 'System Administrator',
        bannerImage: '',
        bannerColor: '',
        enrollmentNo: '',
        course: '',
        branch: '',
        year: 1,
        skills: [],
        expertise: [],
        experience: 0,
        researchAreas: [],
        achievements: [],
        officeHours: 'To be scheduled',
        projectsSupervised: [],
        socialLinks: {
          github: '',
          linkedin: '',
          portfolio: ''
        },
        projects: []
      },
      followers: [],
      following: [],
      followerCount: 0,
      followingCount: 0,
      isActive: true,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert directly into the users collection
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@postup.com');
    console.log('Password: admin123');
    console.log('User ID:', result.insertedId);
    
    // Verify the user was created
    const verifyUser = await db.collection('users').findOne({ email: 'admin@postup.com' });
    console.log('✅ Verification - User found:', verifyUser.email);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

createAdminWithCorrectModel();
