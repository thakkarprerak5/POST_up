// scripts/setup-mentor-system.js
// Quick setup script for Mentor Assignment System
const mongoose = require('mongoose');

async function setupMentorSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create sample users if they don't exist
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 Found ${users.length} users`);

    // Check if we have the required user types
    const superAdmin = users.find(u => u.type === 'super-admin');
    const mentors = users.filter(u => u.type === 'mentor');
    const students = users.filter(u => u.type === 'student');

    console.log(`👤 Super Admins: ${superAdmin ? 1 : 0}`);
    console.log(`👨 Mentors: ${mentors.length}`);
    console.log(`🎓 Students: ${students.length}`);

    if (!superAdmin) {
      console.log('⚠️  No Super Admin found. Creating one...');
      await db.collection('users').insertOne({
        fullName: 'Super Admin',
        email: 'admin@postup.com',
        password: '$2b$12$exampleHash', // This should be properly hashed
        type: 'super-admin',
        photo: '/placeholder-user.jpg',
        profile: {
          type: 'student',
          joinedDate: new Date()
        },
        isActive: true,
        isBlocked: false,
        followers: [],
        following: [],
        followerCount: 0,
        followingCount: 0
      });
      console.log('✅ Created Super Admin user (admin@postup.com)');
    }

    if (mentors.length === 0) {
      console.log('⚠️  No mentors found. Creating sample mentors...');
      await db.collection('users').insertMany([
        {
          fullName: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@postup.com',
          password: '$2b$12$exampleHash',
          type: 'mentor',
          photo: '/placeholder-user.jpg',
          profile: {
            type: 'mentor',
            joinedDate: new Date(),
            department: 'Computer Science',
            position: 'Senior Lecturer',
            expertise: ['Web Development', 'Machine Learning', 'Database Systems'],
            officeHours: 'Mon-Wed 2-4pm'
          }
        },
        {
          fullName: 'Prof. Michael Chen',
          email: 'michael.chen@postup.com',
          password: '$2b$12$exampleHash',
          type: 'mentor',
          photo: '/placeholder-user.jpg',
          profile: {
            type: 'mentor',
            joinedDate: new Date(),
            department: 'Computer Science',
            position: 'Associate Professor',
            expertise: ['Mobile Development', 'UI/UX Design', 'Cloud Computing'],
            officeHours: 'Tue-Thu 10-12pm'
          }
        }
      ]);
      console.log('✅ Created 2 sample mentors');
    }

    if (students.length === 0) {
      console.log('⚠️  No students found. Creating sample students...');
      await db.collection('users').insertMany([
        {
          fullName: 'Alice Williams',
          email: 'alice.williams@postup.com',
          password: '$2b$12$exampleHash',
          type: 'student',
          photo: '/placeholder-user.jpg',
          profile: {
            type: 'student',
            joinedDate: new Date(),
            course: 'B.Tech Computer Science',
            branch: 'Artificial Intelligence',
            year: 3
          }
        },
        {
          'fullName': 'Bob Brown',
          email: 'bob.brown@postup.com',
          password: '$2b$12$exampleHash',
          type: 'student',
          photo: '/placeholder-user.jpg',
          profile: {
            type: 'student',
            joinedDate: new Date(),
            course: 'B.Tech Computer Science',
            branch: 'Data Science',
            year: 2
          }
        }
      ]);
      console.log('✅ Created 2 sample students');
    }

    // Create a sample group
    const groups = await db.collection('groups').find({}).toArray();
    if (groups.length === 0) {
      console.log('⚠️  No groups found. Creating sample group...');
      const mentorId = mentors.length > 0 ? mentors[0]._id : null;
      await db.collection('groups').insertOne({
        name: 'AI Research Group',
        description: 'Advanced AI and Machine Learning research group',
        mentorId: mentorId,
        studentIds: students.map(s => s._id),
        isActive: true
      });
      console.log('✅ Created sample group with mentor');
    }

    console.log('\n🎉 Mentor Assignment System Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to http://localhost:3000/admin/students');
    console.log('2. Use Authorization header: "Bearer super-admin-token"');
    console.log('3. Assign mentors to students');
    console.log('4. Check student and mentor dashboards');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setupMentorSystem();
