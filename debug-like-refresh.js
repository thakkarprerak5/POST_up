// Debug why likes show 0 after refresh despite being in database
const BASE_URL = 'http://localhost:3000';

async function debugLikeRefreshIssue() {
  console.log('🔍 Debugging Like Refresh Issue...\n');
  
  try {
    // Step 1: Check database directly
    console.log('Step 1: Checking database directly...');
    const { MongoClient } = require('mongodb');
    const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db('post-up');
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');
    
    const firstProject = await projectsCollection.findOne({ title: 'First Project' });
    console.log('Database - First Project:');
    console.log(`   Likes Array: [${(firstProject.likes || []).join(', ')}]`);
    console.log(`   Like Count: ${firstProject.likeCount || 0}`);
    console.log(`   Likes Length: ${(firstProject.likes || []).length}`);
    
    // Get all users to see who might be logged in
    const users = await usersCollection.find({}).toArray();
    console.log('\nAvailable users in database:');
    users.forEach(user => {
      console.log(`   ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    // Step 2: Check API response
    console.log('\nStep 2: Checking API response...');
    const apiResponse = await fetch(`${BASE_URL}/api/projects/${firstProject._id}`);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('API - First Project:');
      console.log(`   Like Count: ${apiData.likeCount}`);
      console.log(`   Liked By User: ${apiData.likedByUser}`);
      console.log(`   Likes Array: [${(apiData.likes || []).join(', ')}]`);
      console.log(`   Likes Length: ${(apiData.likes || []).length}`);
      
      // Step 3: Check if props are being passed correctly
      console.log('\nStep 3: Checking component props...');
      console.log('Expected props:');
      console.log(`   initialLikes: ${firstProject.likeCount || 0}`);
      console.log(`   likedByUser: ${apiData.likedByUser}`);
      
      console.log('\n💡 Analysis:');
      if ((firstProject.likes || []).length > 0) {
        console.log('✅ Database HAS likes');
        if (apiData.likeCount === 0) {
          console.log('❌ API returning 0 likes - BUG!');
        } else {
          console.log('✅ API returning correct like count');
        }
        
        // Check if any user ID matches the likes
        const likedUserIds = firstProject.likes || [];
        const matchingUser = users.find(user => 
          likedUserIds.includes(user._id.toString()) || 
          likedUserIds.some(likeId => likeId.toString() === user._id.toString())
        );
        
        if (matchingUser) {
          console.log(`✅ Found matching user: ${matchingUser.name} (${matchingUser.email})`);
          console.log(`❌ But likedByUser is ${apiData.likedByUser} - should be true!`);
        } else {
          console.log('❌ No matching user found for the likes in database');
          console.log('   This might mean the user who liked the project was deleted');
        }
      } else {
        console.log('❌ Database has no likes');
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLikeRefreshIssue();
