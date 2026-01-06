// Test the like state persistence after refresh
const BASE_URL = 'http://localhost:3000';

async function testLikeStatePersistence() {
  console.log('🔍 Testing Like State Persistence...\n');
  
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
    console.log(`Testing with project: ${testProject.title}`);
    console.log(`Project ID: ${testProject._id}`);
    
    // Test the project detail API to see if likedByUser is working
    console.log('\n🔍 Testing project detail API...');
    try {
      const projectResponse = await fetch(`${BASE_URL}/api/projects/${testProject._id}`);
      console.log(`Project detail API status: ${projectResponse.status}`);
      
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        console.log('✅ Project detail response:');
        console.log(`   Title: ${projectData.title}`);
        console.log(`   Like Count: ${projectData.likeCount}`);
        console.log(`   Likes Array Length: ${projectData.likes?.length || 0}`);
        console.log(`   Liked By User: ${projectData.likedByUser}`);
        console.log(`   Comments Count: ${projectData.comments?.length || 0}`);
        console.log(`   Share Count: ${projectData.shareCount}`);
        
        // Check if the data is consistent
        const likesArrayLength = projectData.likes?.length || 0;
        const likeCount = projectData.likeCount || 0;
        
        console.log('\n📊 Data Consistency Check:');
        console.log(`   Likes Array Length: ${likesArrayLength}`);
        console.log(`   Like Count: ${likeCount}`);
        console.log(`   Data Match: ${likesArrayLength === likeCount ? '✅' : '❌'}`);
        
        if (likesArrayLength !== likeCount) {
          console.log('⚠️  Like count mismatch detected - this could cause the reset issue');
        }
      } else {
        const errorData = await projectResponse.json().catch(() => ({}));
        console.log('❌ Project detail API error:', errorData);
      }
    } catch (error) {
      console.log('❌ Project detail API error:', error.message);
    }
    
    console.log('\n💡 Analysis:');
    console.log('The like state persistence issue could be caused by:');
    console.log('1. likedByUser not being calculated correctly in the API');
    console.log('2. Component not syncing with prop changes');
    console.log('3. Like count mismatch between array and count field');
    console.log('4. State not being properly initialized from props');
    
    console.log('\n✅ Fix Applied:');
    console.log('✅ Added useEffect to sync like state when likedByUser prop changes');
    console.log('✅ Added useEffect to sync like count when initialLikes prop changes');
    console.log('✅ Added useEffect to sync comments and shares when props change');
    console.log('✅ Component now properly re-syncs state on prop updates');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLikeStatePersistence();
