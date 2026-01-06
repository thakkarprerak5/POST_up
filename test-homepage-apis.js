// Test home page API endpoints to verify like data
const BASE_URL = 'http://localhost:3000';

async function testHomePageAPIs() {
  console.log('🔍 Testing Home Page API Endpoints...\n');
  
  try {
    // Test 1: Latest projects API (authenticated=true)
    console.log('Test 1: /api/projects?limit=8&authenticated=true');
    const latestResponse = await fetch(`${BASE_URL}/api/projects?limit=8&authenticated=true`);
    if (latestResponse.ok) {
      const latestProjects = await latestResponse.json();
      console.log(`✅ Found ${latestProjects.length} projects`);
      
      if (latestProjects.length > 0) {
        const firstProject = latestProjects[0];
        console.log(`  First project: ${firstProject.title}`);
        console.log(`  Like count: ${firstProject.likeCount || 0}`);
        console.log(`  Liked by user: ${firstProject.likedByUser || false}`);
        console.log(`  Likes array: [${(firstProject.likes || []).join(', ')}]`);
      }
    } else {
      console.log(`❌ Failed: ${latestResponse.status}`);
    }
    
    // Test 2: Trending projects API
    console.log('\nTest 2: /api/projects?limit=10&sort=trending&authenticated=true');
    const trendingResponse = await fetch(`${BASE_URL}/api/projects?limit=10&sort=trending&authenticated=true`);
    if (trendingResponse.ok) {
      const trendingProjects = await trendingResponse.json();
      console.log(`✅ Found ${trendingProjects.length} trending projects`);
      
      // Find First Project in trending
      const firstProject = trendingProjects.find(p => p.title === 'First Project');
      if (firstProject) {
        console.log(`  Found First Project in trending:`);
        console.log(`  Like count: ${firstProject.likeCount || 0}`);
        console.log(`  Liked by user: ${firstProject.likedByUser || false}`);
        console.log(`  Likes array: [${(firstProject.likes || []).join(', ')}]`);
      } else {
        console.log(`  First Project not found in trending`);
      }
    } else {
      console.log(`❌ Failed: ${trendingResponse.status}`);
    }
    
    // Test 3: User-specific projects (if we have a user ID)
    console.log('\nTest 3: /api/projects?author=69327a20497d40e9eb1cd438&authenticated=true');
    const userProjectsResponse = await fetch(`${BASE_URL}/api/projects?author=69327a20497d40e9eb1cd438&authenticated=true`);
    if (userProjectsResponse.ok) {
      const userProjects = await userProjectsResponse.json();
      console.log(`✅ Found ${userProjects.length} user projects`);
      
      const firstProject = userProjects.find(p => p.title === 'First Project');
      if (firstProject) {
        console.log(`  Found First Project in user projects:`);
        console.log(`  Like count: ${firstProject.likeCount || 0}`);
        console.log(`  Liked by user: ${firstProject.likedByUser || false}`);
        console.log(`  Likes array: [${(firstProject.likes || []).join(', ')}]`);
      }
    } else {
      console.log(`❌ Failed: ${userProjectsResponse.status}`);
    }
    
    console.log('\n🎉 Home Page API Test Complete!');
    console.log('\n📝 Expected Behavior:');
    console.log('- First Project should show like count: 1');
    console.log('- When logged in as thakkarprerak5@gmail.com, likedByUser should be: true');
    console.log('- When not logged in, likedByUser should be: false');
    console.log('- Like count should always be: 1 (from database)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testHomePageAPIs();
