const mongoose = require('mongoose');

async function checkAndFixAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    
    console.log('Checking admin@postup.com user...');
    const user = await mongoose.connection.db.collection('users').findOne({email: 'admin@postup.com'});
    
    console.log('Current database user:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Type:', user.type);
    console.log('- All fields:', Object.keys(user));
    
    // Force update the role field
    const updateResult = await mongoose.connection.db.collection('users').updateOne(
      {email: 'admin@postup.com'},
      {
        $set: {
          role: 'super-admin',
          type: 'super-admin'
        }
      }
    );
    
    console.log('Update result:', updateResult);
    
    // Verify the update
    const updatedUser = await mongoose.connection.db.collection('users').findOne({email: 'admin@postup.com'});
    console.log('Updated user:');
    console.log('- Role:', updatedUser.role);
    console.log('- Type:', updatedUser.type);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndFixAdmin();
