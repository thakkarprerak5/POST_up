// Test complete flow: Login -> Upload -> Profile
async function testCompleteFlow() {
  console.log('🔄 Testing Complete User Flow\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Step 1: Test login
    console.log('🔑 Step 1: Testing Login');
    const loginResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      console.log('   ✅ Login successful');
      // Note: In a real browser, cookies would be set automatically
    } else {
      const loginError = await loginResponse.json();
      console.log(`   ❌ Login failed: ${loginError.error}`);
      return;
    }
    
    // Step 2: Test project upload (this will fail without browser session)
    console.log('\n📤 Step 2: Testing Project Upload');
    console.log('   ⚠️  Note: This requires browser session cookies');
    console.log('   💡 Please test manually in browser after login');
    
    // Step 3: Check if user exists in database
    console.log('\n👤 Step 3: Verifying User in Database');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: 'test@example.com' });
    
    if (user) {
      console.log(`   ✅ User found: ${user.fullName} (${user.email})`);
      console.log(`   🆔 User ID: ${user._id}`);
      
      // Step 4: Test user projects endpoint
      console.log('\n📁 Step 4: Testing User Projects API');
      const userProjectsResponse = await fetch(`${baseUrl}/api/users/${user._id}/projects`);
      if (userProjectsResponse.ok) {
        const userProjects = await userProjectsResponse.json();
        console.log(`   ✅ User projects API working: ${userProjects.length} projects found`);
      } else {
        console.log(`   ❌ User projects API failed: ${userProjectsResponse.status}`);
      }
    }
    
    await mongoose.disconnect();
    
    console.log('\n🎯 MANUAL TESTING INSTRUCTIONS:');
    console.log('1. Open browser and go to: http://localhost:3000/login');
    console.log('2. Login with:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log('3. After login, go to: http://localhost:3000/upload');
    console.log('4. Fill in project details and upload');
    console.log('5. Check your profile at: http://localhost:3000/profile');
    console.log('6. Verify the project appears in your profile');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();
