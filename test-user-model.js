const mongoose = require('mongoose');

// Use the exact same schema as the TypeScript User model
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
}, { timestamps: true, collection: 'users' }); // Explicitly set collection name

const User = mongoose.model('User', userSchema);

async function testUserModel() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    
    console.log('Testing findUserByEmail function...');
    const user = await User.findOne({ email: 'admin@postup.com' });
    
    if (user) {
      console.log('✅ User found!');
      console.log('Email:', user.email);
      console.log('Type:', user.type);
      console.log('Full Name:', user.fullName);
    } else {
      console.log('❌ User not found');
      
      // Check what users exist
      const allUsers = await User.find({});
      console.log('Total users in model:', allUsers.length);
      allUsers.forEach(u => {
        console.log(' - Email:', u.email, 'Type:', u.type);
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

testUserModel();
