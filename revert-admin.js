const mongoose = require('mongoose');

async function revertAdminToStudent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/POST_up');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Find current admin user
    const adminUser = await db.collection('users').findOne({email: 'admin@postup.com'});
    if (adminUser) {
      console.log('Current logged in user:', adminUser.email);
      console.log('Current type:', adminUser.type);
      console.log('Current role:', adminUser.role);
      
      // Update to student
      const result = await db.collection('users').updateOne(
        {email: 'admin@postup.com'},
        { 
          $set: { 
            type: 'student',
            role: 'student'
          }
        }
      );
      
      console.log('Update result:', result);
      
      // Verify the update
      const updatedUser = await db.collection('users').findOne({email: 'admin@postup.com'});
      if (updatedUser) {
        console.log('✅ Admin user reverted to student!');
        console.log('Email:', updatedUser.email);
        console.log('Type:', updatedUser.type);
        console.log('Role:', updatedUser.role);
      }
    } else {
      console.log('Admin user not found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}

revertAdminToStudent();
