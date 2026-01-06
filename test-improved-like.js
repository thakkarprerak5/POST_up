// Test the improved like endpoint with verification
const BASE_URL = 'http://localhost:3000';

async function testImprovedLikeEndpoint() {
  console.log('🔍 Testing Improved Like Endpoint...\n');
  
  try {
    // First, let's unlike to reset the state
    console.log('Step 1: Unliking project to reset state...');
    const unlikeResponse = await fetch(`${BASE_URL}/api/projects/693aaf4dc27e95a9fd1a0f05/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (unlikeResponse.ok) {
      const unlikeData = await unlikeResponse.json();
      console.log('✅ Unlike response:', unlikeData);
    } else {
      console.log('❌ Unlike failed');
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Now test liking again
    console.log('Step 2: Liking project again...');
    const likeResponse = await fetch(`${BASE_URL}/api/projects/693aaf4dc27e95a9fd1a0f05/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (likeResponse.ok) {
      const likeData = await likeResponse.json();
      console.log('✅ Like response:', likeData);
      
      // Check the project detail to see if like persisted
      console.log('Step 3: Checking if like persisted...');
      const detailResponse = await fetch(`${BASE_URL}/api/projects/693aaf4dc27e95a9fd1a0f05`);
      
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        console.log('✅ Project detail after like:');
        console.log(`   Like Count: ${detailData.likeCount}`);
        console.log(`   Liked By User: ${detailData.likedByUser}`);
        console.log(`   Likes Array: [${(detailData.likes || []).join(', ')}]`);
        console.log(`   Likes Length: ${(detailData.likes || []).length}`);
        
        if (detailData.likeCount === 1 && detailData.likedByUser === true) {
          console.log('🎉 SUCCESS: Like persisted correctly!');
        } else {
          console.log('❌ FAILURE: Like did not persist');
          console.log('Expected: likeCount=1, likedByUser=true');
          console.log(`Actual: likeCount=${detailData.likeCount}, likedByUser=${detailData.likedByUser}`);
        }
      } else {
        console.log('❌ Failed to get project details');
      }
    } else {
      console.log('❌ Like request failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImprovedLikeEndpoint();
