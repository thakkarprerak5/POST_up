// Test script to verify authenticated user filtering
const BASE_URL = 'http://localhost:3000';

async function testAuthenticatedFiltering() {
  console.log('🧪 Testing Authenticated User Filtering...\n');
  
  try {
    // Test 1: Check regular projects API (all projects)
    console.log('📦 Step 1: Testing regular projects API...');
    const allProjectsResponse = await fetch(`${BASE_URL}/api/projects?limit=8`);
    const allProjectsText = await allProjectsResponse.text();
    
    let allProjects;
    try {
      const jsonStart = allProjectsText.indexOf('[');
      const jsonEnd = allProjectsText.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = allProjectsText.substring(jsonStart, jsonEnd);
        allProjects = JSON.parse(jsonPart);
      } else {
        allProjects = JSON.parse(allProjectsText);
      }
    } catch (error) {
      console.error('Failed to parse all projects response:', error.message);
      return;
    }
    
    console.log(`All projects in database: ${allProjects.length}`);
    
    // Test 2: Check authenticated-only projects API
    console.log('\n🔐 Step 2: Testing authenticated-only projects API...');
    const authProjectsResponse = await fetch(`${BASE_URL}/api/projects?limit=8&authenticated=true`);
    const authProjectsText = await authProjectsResponse.text();
    
    let authProjects;
    try {
      const jsonStart = authProjectsText.indexOf('[');
      const jsonEnd = authProjectsText.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = authProjectsText.substring(jsonStart, jsonEnd);
        authProjects = JSON.parse(jsonPart);
      } else {
        authProjects = JSON.parse(authProjectsText);
      }
    } catch (error) {
      console.error('Failed to parse auth projects response:', error.message);
      return;
    }
    
    console.log(`Projects from authenticated users: ${authProjects.length}`);
    
    // Test 3: Compare the results
    console.log('\n📊 Step 3: Comparing results...');
    console.log(`All projects: ${allProjects.length}`);
    console.log(`Authenticated user projects: ${authProjects.length}`);
    console.log(`Projects hidden: ${allProjects.length - authProjects.length}`);
    
    if (allProjects.length > authProjects.length) {
      console.log('\n🔍 Projects that were hidden:');
      allProjects.forEach(project => {
        const isInAuth = authProjects.find(p => (p._id || p.id) === (project._id || project.id));
        if (!isInAuth) {
          console.log(`  - ${project.title} by ${project.author?.name} (Author ID: ${project.author?.id})`);
        }
      });
    }
    
    // Test 4: Show authenticated projects
    if (authProjects.length > 0) {
      console.log('\n✅ Projects from authenticated users:');
      authProjects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title} by ${project.author?.name}`);
        console.log(`     Author ID: ${project.author?.id}`);
        console.log(`     Likes: ${project.likeCount || 0}, Comments: ${project.comments?.length || 0}`);
      });
    } else {
      console.log('\n❌ No projects from authenticated users found');
    }
    
    // Test 5: Check trending with authenticated filter
    console.log('\n📈 Step 4: Testing trending with authenticated filter...');
    const trendingAuthResponse = await fetch(`${BASE_URL}/api/projects?limit=10&sort=trending&authenticated=true`);
    const trendingAuthText = await trendingAuthResponse.text();
    
    let trendingAuth;
    try {
      const jsonStart = trendingAuthText.indexOf('[');
      const jsonEnd = trendingAuthText.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = trendingAuthText.substring(jsonStart, jsonEnd);
        trendingAuth = JSON.parse(jsonPart);
      } else {
        trendingAuth = JSON.parse(trendingAuthText);
      }
    } catch (error) {
      console.error('Failed to parse trending auth response:', error.message);
      return;
    }
    
    console.log(`Trending projects from authenticated users: ${trendingAuth.length}`);
    
    console.log('\n✅ Authenticated User Filtering Test Completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Total projects: ${allProjects.length}`);
    console.log(`✅ Authenticated user projects: ${authProjects.length}`);
    console.log(`✅ Projects hidden from home: ${allProjects.length - authProjects.length}`);
    console.log(`✅ Trending authenticated projects: ${trendingAuth.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuthenticatedFiltering();
