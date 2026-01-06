const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use the same MongoDB URI as the server
const MONGODB_URI = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';

async function createCloudAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = mongoose.connection.db;
    
    // Check current users
    const users = await db.collection('users').find({}).toArray();
    console.log('Current users in cloud database:');
    users.forEach(u => console.log(' -', u.email, '(type:', u.type + ')'));
    
    // Create admin user
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
        socialLinks: { github: '', linkedin: '', portfolio: '' },
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
    
    // Delete if exists and create new
    await db.collection('users').deleteOne({ email: 'admin@postup.com' });
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created in cloud database!');
    console.log('Email: admin@postup.com');
    console.log('Password: admin123');
    console.log('User ID:', result.insertedId);
    
    // Verify
    const verifyAdmin = await db.collection('users').findOne({ email: 'admin@postup.com' });
    console.log('✅ Verification - Admin found:', verifyAdmin ? 'YES' : 'NO');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

createCloudAdmin();
