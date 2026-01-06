const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function makeExistingUserAdmin() {
  await mongoose.connect('mongodb://localhost:27017/postup');
  const db = mongoose.connection.db;
  
  // Get the first existing user and make them admin
  const existingUser = await db.collection('users').findOne({ email: 'thakkarprerak5@gmail.com' });
  
  if (existingUser) {
    // Update to admin
    await db.collection('users').updateOne(
      { email: 'thakkarprerak5@gmail.com' },
      { 
        $set: { 
          type: 'super_admin',
          password: await bcrypt.hash('admin123', 10)
        }
      }
    );
    
    console.log('✅ Updated thakkarprerak5@gmail.com to admin!');
    console.log('Email: thakkarprerak5@gmail.com');
    console.log('Password: admin123 (new password)');
  }
  
  mongoose.connection.close();
}

makeExistingUserAdmin();
