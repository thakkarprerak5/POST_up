// Test API endpoints directly
async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Get projects (should work even without users)
    console.log('📋 Testing GET /api/projects');
    const projectsResponse = await fetch(`${baseUrl}/api/projects`);
    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      console.log(`✅ Found ${projects.length} projects`);
      
      if (projects.length > 0) {
        const firstProject = projects[0];
        console.log(`   First project: ${firstProject.title}`);
        console.log(`   Author ID: ${firstProject.author?.id || 'Not found'}`);
        console.log(`   Author Name: ${firstProject.author?.name || 'Not found'}`);
      }
    } else {
      console.log(`❌ Failed with status: ${projectsResponse.status}`);
    }
    
    // Test 2: Test user projects endpoint (should return empty if no user exists)
    console.log('\n👤 Testing GET /api/users/507f191e810c19729de860ea/projects');
    const userProjectsResponse = await fetch(`${baseUrl}/api/users/507f191e810c19729de860ea/projects`);
    if (userProjectsResponse.ok) {
      const userProjects = await userProjectsResponse.json();
      console.log(`✅ Found ${userProjects.length} projects for test user`);
    } else {
      console.log(`❌ Failed with status: ${userProjectsResponse.status}`);
    }
    
    // Test 3: Test mentors endpoint
    console.log('\n🎓 Testing GET /api/mentors');
    const mentorsResponse = await fetch(`${baseUrl}/api/mentors`);
    if (mentorsResponse.ok) {
      const mentors = await mentorsResponse.json();
      console.log(`✅ Found ${mentors.length} mentors`);
    } else {
      console.log(`❌ Failed with status: ${mentorsResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    console.log('💡 Make sure the development server is running on localhost:3000');
  }
}

// Only run if fetch is available (Node.js 18+)
if (typeof fetch !== 'undefined') {
  testAPIEndpoints();
} else {
  console.log('❌ This test requires Node.js 18+ with fetch support');
  console.log('💡 Or run: node --experimental-fetch test-api-endpoints.js');
}
