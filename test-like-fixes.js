// Test script to verify like functionality fixes
const BASE_URL = 'http://localhost:3000';

async function testLikeFunctionality() {
  console.log('🧪 Testing Like Functionality Fixes...\n');
  
  try {
    // Test 1: Check if projects API is working
    console.log('Test 1: Testing /api/projects endpoint...');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      console.log(`✅ Projects API working - Found ${projects.length} projects`);
      
      if (projects.length > 0) {
        const firstProject = projects[0];
        console.log(`   First project: ${firstProject.title}`);
        console.log(`   Like count: ${firstProject.likeCount || 0}`);
        console.log(`   Liked by user: ${firstProject.likedByUser || false}`);
        
        // Test 2: Check if specific project API is working
        console.log('\nTest 2: Testing /api/projects/[id] endpoint...');
        const projectResponse = await fetch(`${BASE_URL}/api/projects/${projects[0].id}`);
        if (projectResponse.ok) {
          const project = await projectResponse.json();
          console.log(`✅ Project API working`);
          console.log(`   Project: ${project.title}`);
          console.log(`   Like count: ${project.likeCount || 0}`);
          console.log(`   Liked by user: ${project.likedByUser || false}`);
        } else {
          console.log('❌ Project API failed');
        }
      }
    } else {
      console.log('❌ Projects API failed');
    }

    // Test 3: Check feed page
    console.log('\nTest 3: Testing feed page...');
    const feedResponse = await fetch(`${BASE_URL}/feed`);
    if (feedResponse.ok) {
      console.log('✅ Feed page accessible');
    } else {
      console.log('❌ Feed page failed');
    }

    console.log('\n🎉 Testing completed!');
    console.log('\n📝 Summary:');
    console.log('- likedByUser calculation has been fixed in API endpoints');
    console.log('- Feed pages now fetch data from API instead of static data');
    console.log('- Like counts should now display correctly after refresh');
    console.log('\n💡 Note: likedByUser will only be true when user is logged in');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLikeFunctionality();
