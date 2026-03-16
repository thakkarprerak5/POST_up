const mongoose = require('mongoose');

async function fixAdminRole() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    
    // Fix the admin@postup.com user
    const result = await mongoose.connection.db.collection('users').updateOne(
      {email: 'admin@postup.com'},
      {$set: {role: 'super-admin', type: 'super-admin'}}
    );
    
    console.log('✅ Fixed admin@postup.com user role');
    console.log('Modified:', result.modifiedCount);
    
    // Verify the fix
    const user = await mongoose.connection.db.collection('users').findOne({email: 'admin@postup.com'});
    console.log('Updated user:', {
      email: user.email,
      role: user.role,
      type: user.type
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminRole();
