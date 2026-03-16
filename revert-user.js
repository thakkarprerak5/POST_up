const mongoose = require('mongoose');

async function revertUserToStudent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/POST_up');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Update user back to student
    const result = await db.collection('users').updateOne(
      { email: 'thakkarprerak5@gmail.com' },
      { 
        $set: { 
          type: 'student',
          role: 'student'
        }
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const user = await db.collection('users').findOne({email: 'thakkarprerak5@gmail.com'});
    if (user) {
      console.log('✅ User reverted to student!');
      console.log('Email:', user.email);
      console.log('Type:', user.type);
      console.log('Role:', user.role);
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}

revertUserToStudent();
