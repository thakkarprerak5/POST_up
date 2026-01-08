const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('👤 Creating Test User Account\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    console.log('✅ Connected to database');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log(`   Email: test@example.com`);
      console.log(`   Password: password123`);
      console.log(`   ID: ${existingUser._id}`);
      return;
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      photo: '/placeholder-user.jpg',
      type: 'student',
      profile: {
        type: 'student',
        joinedDate: new Date(),
        bio: 'Test user for verifying project upload functionality',
        skills: ['JavaScript', 'React', 'Node.js'],
        course: 'Computer Science',
        branch: 'Software Engineering',
        year: 3
      },
      followers: [],
      following: [],
      followerCount: 0,
      followingCount: 0,
      isActive: true,
      isBlocked: false
    };
    
    const result = await usersCollection.insertOne(testUser);
    console.log('✅ Test user created successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log(`   User ID: ${result.insertedId}`);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Go to http://localhost:3000/login');
    console.log('   2. Login with the above credentials');
    console.log('   3. Go to http://localhost:3000/upload to upload a project');
    console.log('   4. Check your profile at http://localhost:3000/profile');
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();
