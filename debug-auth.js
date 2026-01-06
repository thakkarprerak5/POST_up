const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function debugAuth() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    
    // Check if user exists using direct MongoDB query
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email: 'admin@postup.com' });
    
    if (user) {
      console.log('✅ User found in database:');
      console.log('Email:', user.email);
      console.log('Type:', user.type);
      console.log('Password hash length:', user.password.length);
      
      // Test password comparison
      const isValid = await bcrypt.compare('admin123', user.password);
      console.log('Password validation:', isValid);
      
      // Test the exact same query as the auth system
      const User = mongoose.model('User', new mongoose.Schema({}, {collection: 'users'}));
      const foundUser = await User.findOne({ email: 'admin@postup.com' });
      console.log('Mongoose model query result:', foundUser ? 'Found' : 'Not found');
      
      if (foundUser) {
        console.log('Found user email:', foundUser.email);
      }
    } else {
      console.log('❌ User not found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

debugAuth();
