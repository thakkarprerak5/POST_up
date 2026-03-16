const mongoose = require('mongoose');

async function checkAdmins() {
  try {
    await mongoose.connect('mongodb://localhost:27017/postup');
    const admins = await mongoose.connection.db.collection('users').find({role: {$in: ['admin', 'super-admin']}}).toArray();
    
    console.log('Admin users found:');
    if (admins.length === 0) {
      console.log('No admin users found. Creating default admin...');
      
      // Create default admin
      const result = await mongoose.connection.db.collection('users').insertOne({
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO.', // password: admin123
        role: 'admin',
        type: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created admin user:');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
      console.log('Role: admin');
    } else {
      admins.forEach(admin => {
        console.log(`- ${admin.name || admin.email} (${admin.email}) - ${admin.role}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmins();
