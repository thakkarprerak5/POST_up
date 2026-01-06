// Test the like endpoint to see if it's working correctly
const BASE_URL = 'http://localhost:3000';

async function testLikeEndpoint() {
  console.log('🔍 Testing Like Endpoint...\n');
  
  try {
    // Get a real project to test with
    const response = await fetch(`${BASE_URL}/api/projects?authenticated=true`);
    const responseText = await response.text();
    
    const jsonStart = responseText.indexOf('[');
    const jsonEnd = responseText.lastIndexOf(']') + 1;
    const projects = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    
    if (projects.length === 0) {
      console.log('❌ No real projects found to test with');
      return;
    }
    
    const testProject = projects[0];
    console.log(`Testing like endpoint with: ${testProject.title}`);
    console.log(`Project ID: ${testProject._id}`);
    console.log(`Current like count: ${testProject.likeCount}`);
    console.log(`Current likes array: [${(testProject.likes || []).join(', ')}]`);
    
    // Test the like endpoint (this should toggle the like)
    console.log('\n👍 Testing POST to like endpoint...');
    try {
      const likeResponse = await fetch(`${BASE_URL}/api/projects/${testProject._id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Like endpoint status: ${likeResponse.status}`);
      
      if (likeResponse.ok) {
        const likeData = await likeResponse.json();
        console.log('✅ Like response:', likeData);
        console.log(`   Liked: ${likeData.liked}`);
        console.log(`   Like Count: ${likeData.likeCount}`);
        console.log(`   Project Likes: [${(likeData.project?.likes || []).join(', ')}]`);
        
        // Check if the like was actually added to the database
        console.log('\n🔍 Checking if like persisted...');
        
        // Get project again to verify
        const verifyResponse = await fetch(`${BASE_URL}/api/projects/${testProject._id}`);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('✅ Verification response:');
          console.log(`   Like Count: ${verifyData.likeCount}`);
          console.log(`   Likes Array: [${(verifyData.likes || []).join(', ')}]`);
          console.log(`   Liked By User: ${verifyData.likedByUser}`);
          
          // Check if the like actually persisted
          const likesCount = (verifyData.likes || []).length;
          const likeCountField = verifyData.likeCount || 0;
          
          if (likesCount !== likeCountField) {
            console.log(`❌ MISMATCH: Array has ${likesCount} but count is ${likeCountField}`);
          } else {
            console.log(`✅ CONSISTENT: Array and count match`);
          }
        }
        
      } else {
        const errorData = await likeResponse.json().catch(() => ({}));
        console.log('❌ Like endpoint error:', errorData);
        console.log('This might be why likes are disappearing');
      }
    } catch (error) {
      console.log('❌ Like endpoint test error:', error.message);
    }
    
    console.log('\n💡 Possible Issues:');
    console.log('1. Like endpoint not properly updating database');
    console.log('2. Like endpoint returning wrong data');
    console.log('3. Race condition in like/unlike logic');
    console.log('4. Authentication issue in like endpoint');
    console.log('5. Database connection issue');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLikeEndpoint();
