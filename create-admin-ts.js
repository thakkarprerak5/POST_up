const mongoose = require('mongoose');

// Define the exact same schema as the TypeScript User model
const profileSchema = new mongoose.Schema({
  type: { type: String, enum: ['student', 'mentor'], required: true },
  joinedDate: { type: Date, default: Date.now },
  bio: { type: String, default: '' },
  department: { type: String, default: '' },
  position: { type: String, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String, default: '/placeholder-user.jpg' },
  type: { type: String, enum: ['student', 'mentor', 'admin', 'super_admin'], required: true },
  profile: { type: profileSchema, required: true },
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

// Hash password middleware
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    
    // Delete existing admin user
    await User.deleteOne({ email: 'admin@postup.com' });
    
    // Create new admin user with proper schema
    const adminUser = new User({
      fullName: 'Admin User',
      email: 'admin@postup.com',
      password: 'admin123', // Will be hashed by pre-save middleware
      type: 'super_admin',
      profile: {
        type: 'mentor',
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
    });
    
    await adminUser.save();
    
    console.log('✅ Admin user created with proper schema!');
    console.log('Email: admin@postup.com');
    console.log('Password: admin123');
    console.log('Role: super_admin');
    
    // Test the find function
    const foundUser = await User.findOne({ email: 'admin@postup.com' });
    console.log('Test query - Email:', foundUser.email);
    console.log('Test query - Type:', foundUser.type);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

createAdminUser();
