const mongoose = require('mongoose');
const User = require('./models/User').default;

async function checkUserRole() {
  try {
    await mongoose.connect('mongodb://localhost:27017/post-up');
    
    const email = 'your-email@example.com'; // Replace with your actual email
    const user = await User.findOne({ email });
    
    if (user) {
      console.log('User found:');
      console.log('Email:', user.email);
      console.log('Name:', user.fullName);
      console.log('Role:', user.type);
      console.log('Is Active:', user.isActive);
      console.log('Is Blocked:', user.isBlocked);
    } else {
      console.log('User not found with email:', email);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserRole();
