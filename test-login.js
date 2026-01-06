const mongoose = require('mongoose');

async function testLogin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    
    const db = mongoose.connection.db;
    
    // Check what users exist
    const users = await db.collection('users').find({}).toArray();
    console.log('All users in database:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}`);
      console.log(`  Type: ${user.type}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Password hash exists: ${!!user.password}`);
      console.log('');
    });
    
    // Test the exact same query as the auth system
    const adminUser = await db.collection('users').findOne({ email: 'admin@postup.com' });
    
    if (adminUser) {
      console.log('✅ Admin user found in database');
      console.log('Email:', adminUser.email);
      console.log('Type:', adminUser.type);
      
      // Test password
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare('admin123', adminUser.password);
      console.log('Password validation:', isValid);
      
      if (isValid) {
        console.log('\n🎉 Login should work! The credentials are correct.');
        console.log('If it\'s still not working, there might be an issue with the TypeScript model.');
      } else {
        console.log('\n❌ Password validation failed');
      }
    } else {
      console.log('❌ Admin user not found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

testLogin();
