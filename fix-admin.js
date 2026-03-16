const mongoose = require('mongoose');

async function checkAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    const admin = await mongoose.connection.db.collection('users').findOne({email: 'admin@example.com'});
    
    console.log('Admin user details:');
    console.log('- Email:', admin.email);
    console.log('- Role field:', admin.role);
    console.log('- Type field:', admin.type);
    console.log('- All fields:', Object.keys(admin));
    
    // Fix the role field to match what the API expects
    await mongoose.connection.db.collection('users').updateOne(
      {email: 'admin@example.com'},
      {$set: {role: 'admin', type: 'admin'}}
    );
    
    console.log('✅ Fixed admin user - set both role and type to "admin"');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminUser();
