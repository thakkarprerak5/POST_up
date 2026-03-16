const mongoose = require('mongoose');

async function restoreAdminAccess() {
  try {
    await mongoose.connect('mongodb://localhost:27017/POST_up');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Restore admin user
    const result = await db.collection('users').updateOne(
      {email: 'admin@postup.com'},
      { 
        $set: { 
          type: 'super-admin',
          role: 'super-admin'
        }
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const user = await db.collection('users').findOne({email: 'admin@postup.com'});
    if (user) {
      console.log('✅ Admin access restored!');
      console.log('Email:', user.email);
      console.log('Type:', user.type);
      console.log('Role:', user.role);
    }
    
    // Also restore thakkar user
    const thakkarResult = await db.collection('users').updateOne(
      {email: 'thakkarprerak5@gmail.com'},
      { 
        $set: { 
          type: 'admin',
          role: 'admin'
        }
      }
    );
    
    console.log('Thakkar update result:', thakkarResult);
    
    const thakkarUser = await db.collection('users').findOne({email: 'thakkarprerak5@gmail.com'});
    if (thakkarUser) {
      console.log('✅ Thakkar admin access restored!');
      console.log('Email:', thakkarUser.email);
      console.log('Type:', thakkarUser.type);
      console.log('Role:', thakkarUser.role);
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
}

restoreAdminAccess();
