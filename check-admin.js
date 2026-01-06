const mongoose = require('mongoose');

// Define User schema inline
const userSchema = new mongoose.Schema({}, { collection: 'users' });
const User = mongoose.model('User', userSchema);

async function checkAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    
    const admin = await User.findOne({ type: { $in: ['admin', 'super_admin'] } });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('Email:', admin.email);
      console.log('Password: admin123 (default)');
      console.log('Role:', admin.type);
      console.log('Name:', admin.fullName);
      console.log('Active:', admin.isActive);
      console.log('Blocked:', admin.isBlocked);
    } else {
      console.log('No admin user found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkAdminUser();
