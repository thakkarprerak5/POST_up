// Test the share functionality
const BASE_URL = 'http://localhost:3000';

async function testShareFunctionality() {
  console.log('🔍 Testing Share Functionality...\n');
  
  try {
    // Get projects
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Testing share on: ${project.title}`);
      console.log(`Current share count: ${project.shareCount || 0}`);
      
      // Test share API
      console.log('\n📤 Testing share API call...');
      const shareResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/share`, {
        method: 'POST'
      });
      
      console.log(`Share API status: ${shareResponse.status}`);
      
      if (shareResponse.ok) {
        const result = await shareResponse.json();
        console.log('✅ Share API working:');
        console.log(`   Shared: ${result.shared}`);
        console.log(`   New share count: ${result.shareCount}`);
      } else {
        const error = await shareResponse.json();
        console.log('❌ Share API failed:');
        console.log(`   Status: ${shareResponse.status}`);
        console.log(`   Error: ${error.error}`);
        
        if (shareResponse.status === 401) {
          console.log('\n🔐 ISSUE IDENTIFIED:');
          console.log('Share API requires authentication but user is not logged in');
          console.log('Frontend should handle this gracefully');
        }
      }
      
      // Test session
      console.log('\n🔑 Checking user session...');
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
      const session = await sessionResponse.json();
      
      if (session?.user?.email) {
        console.log(`✅ User logged in: ${session.user.email}`);
      } else {
        console.log('❌ User not logged in');
        console.log('This is why share API is failing');
      }
      
    } else {
      console.log('❌ No projects found to test');
    }
    
    console.log('\n🔧 SOLUTION:');
    console.log('1. User needs to be logged in to share projects');
    console.log('2. Frontend should show appropriate message when not logged in');
    console.log('3. Share count only increments for authenticated users');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShareFunctionality();
