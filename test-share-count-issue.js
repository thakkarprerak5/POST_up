// Test share functionality in detail
const BASE_URL = 'http://localhost:3000';

async function testShareCountIssue() {
  console.log('🔍 Testing Share Count Issue...\n');
  
  try {
    // Test 1: Check user session
    console.log('🔑 Test 1: Check user session');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const session = await sessionResponse.json();
    
    if (session?.user?.email) {
      console.log(`✅ User logged in: ${session.user.email}`);
      console.log(`   User ID: ${session.user.id}`);
    } else {
      console.log('❌ User not logged in');
      console.log('   → Share count will not increment without login');
      return;
    }
    
    // Test 2: Get current project data
    console.log('\n📦 Test 2: Get current project data');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Project: ${project.title}`);
      console.log(`Current share count: ${project.shareCount || 0}`);
      console.log(`Shares array: ${project.shares?.length || 0}`);
      
      // Test 3: Test share API call
      console.log('\n📤 Test 3: Test share API call');
      const shareResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`Share API status: ${shareResponse.status}`);
      
      if (shareResponse.ok) {
        const result = await shareResponse.json();
        console.log('✅ Share API response:');
        console.log(`   Shared: ${result.shared}`);
        console.log(`   New share count: ${result.shareCount}`);
        console.log(`   Shares array length: ${result.shares?.length || 0}`);
      } else {
        const error = await shareResponse.json();
        console.log('❌ Share API failed:');
        console.log(`   Status: ${shareResponse.status}`);
        console.log(`   Error: ${error.error}`);
        
        if (shareResponse.status === 401) {
          console.log('\n🔐 Still unauthorized - checking session details...');
          console.log('Session:', JSON.stringify(session, null, 2));
        }
      }
      
      // Test 4: Check if share count updated in database
      console.log('\n📊 Test 4: Check updated project data');
      const updatedProjectResponse = await fetch(`${BASE_URL}/api/projects/${project.id}`);
      const updatedProject = await updatedProjectResponse.json();
      
      console.log(`Updated share count: ${updatedProject.shareCount || 0}`);
      console.log(`Updated shares array: ${updatedProject.shares?.length || 0}`);
      
      // Compare before and after
      const beforeCount = project.shareCount || 0;
      const afterCount = updatedProject.shareCount || 0;
      
      console.log('\n📈 SHARE COUNT COMPARISON:');
      console.log(`Before: ${beforeCount}`);
      console.log(`After: ${afterCount}`);
      console.log(`Change: ${afterCount - beforeCount}`);
      
      if (afterCount > beforeCount) {
        console.log('✅ Share count incremented correctly!');
      } else if (afterCount === beforeCount) {
        console.log('⚠️  Share count did not change');
        console.log('   Possible reasons:');
        console.log('   - User already shared this project');
        console.log('   - Share API failed silently');
        console.log('   - Database update issue');
      } else {
        console.log('❌ Share count decreased (unshare)');
      }
      
    } else {
      console.log('❌ No projects found to test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShareCountIssue();
