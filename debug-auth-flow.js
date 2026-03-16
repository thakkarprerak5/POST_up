const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function debugAuthFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Simulate the exact auth flow
    const credentials = {
      email: 'mentor@postup.com',
      password: 'password123'
    };
    
    console.log('\n=== SIMULATING AUTH FLOW ===');
    console.log('🔍 Looking for user with email:', credentials.email);
    
    const user = await db.collection('users').findOne({ email: credentials.email });
    
    console.log('👤 User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('📧 User email:', user.email);
      console.log('👤 User type:', user.type);
      console.log('🔐 Stored password hash:', user.password);
      console.log('🔑 Provided password:', credentials.password);
      
      // Test bcrypt comparison with detailed logging
      console.log('\n=== BCRYPT COMPARISON TEST ===');
      try {
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        console.log('✅ Bcrypt comparison succeeded');
        console.log('🔓 Password valid:', isPasswordValid);
        
        if (isPasswordValid) {
          console.log('\n🎉 AUTHENTICATION SHOULD SUCCEED!');
          console.log('User object that would be returned:');
          console.log({
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            image: user.photo,
            role: user.type,
            type: user.type
          });
        } else {
          console.log('\n❌ AUTHENTICATION SHOULD FAIL!');
        }
      } catch (bcryptError) {
        console.log('❌ Bcrypt comparison failed:', bcryptError.message);
      }
    }
    
    // Also test with a simple password to see if bcrypt is working
    console.log('\n=== BCRYPT SANITY CHECK ===');
    const testHash = await bcrypt.hash('test123', 10);
    const testCompare = await bcrypt.compare('test123', testHash);
    console.log('Basic bcrypt test:', testCompare ? '✅ WORKING' : '❌ BROKEN');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Debug error:', err);
    process.exit(1);
  }
}

debugAuthFlow();
