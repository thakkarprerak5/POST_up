// Check what database the API is actually connected to
async function checkApiDatabase() {
  console.log('🔍 Checking API Database Connection\n');
  
  try {
    // Make a request to trigger the API logging
    const response = await fetch('http://localhost:3000/api/users/695f41e4fbaf7a179f771541/projects');
    const data = await response.json();
    
    console.log('API Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Projects found: ${data.value?.length || 0}`);
    
    // Now check our direct database connection
    console.log('\n🗄️ Checking Direct Database Connection:');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    
    console.log(`Connected to: ${db.databaseName}`);
    console.log(`Connection URI: ${mongoose.connection.client.s.url}`);
    
    const projectsCollection = db.collection('projects');
    const projectCount = await projectsCollection.countDocuments();
    console.log(`Projects in database: ${projectCount}`);
    
    // Check for ganpat project
    const ganpatProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
    if (ganpatProject) {
      console.log('✅ Found ganpat project in direct connection');
      console.log(`   Author ID: ${ganpatProject.author?.id}`);
    } else {
      console.log('❌ No ganpat project found in direct connection');
    }
    
    await mongoose.disconnect();
    
    console.log('\n💡 Possible Solutions:');
    console.log('1. API might be connected to a different database');
    console.log('2. There might be multiple MongoDB instances');
    console.log('3. Environment variable might be different for API');
    console.log('4. Database name might be different');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkApiDatabase();
