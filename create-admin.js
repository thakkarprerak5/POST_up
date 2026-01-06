const mongoose = require('mongoose');

// Define User schema inline since we can't import the TypeScript model
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String, default: '/placeholder-user.jpg' },
  type: { type: String, enum: ['student', 'mentor', 'admin', 'super_admin'], required: true },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  profile: {
    type: { type: String, enum: ['student', 'mentor'], required: true },
    joinedDate: { type: Date, default: Date.now },
    bio: { type: String, default: '' },
    department: { type: String, default: '' },
    position: { type: String, default: '' }
  },
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    
    // Create a new admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminData = {
      fullName: 'Admin User',
      email: 'admin@postup.com',
      password: hashedPassword,
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

createAdminUser();
