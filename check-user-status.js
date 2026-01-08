const { connectDB } = require('./lib/db');
const User = require('./models/User');

async function checkUsers() {
  try {
    await connectDB();
    const users = await User.find({}, { name: 1, email: 1, type: 1, isActive: 1, role: 1 });
    console.log('All users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Type: ${user.type}, Role: ${user.role || 'none'}, Active: ${user.isActive}`);
    });
    console.log(`\nTotal users: ${users.length}`);
    
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    console.log(`Active users: ${activeUsers}`);
    console.log(`Inactive users: ${inactiveUsers}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
