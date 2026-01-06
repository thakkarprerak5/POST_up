// Test the profile API with correct URL format
const BASE_URL = 'http://localhost:3000';

async function testProfileAPI() {
  console.log('🧪 Testing Profile API with Correct URL Format\n');
  
  try {
    // Test 1: Check user session
    console.log('🔑 Test 1: Check user session');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const session = await sessionResponse.json();
    
    if (session?.user?.email) {
      console.log(`✅ User logged in: ${session.user.email}`);
      console.log(`   User ID: ${session.user.id}`);
      
      // Test 2: Get current user profile
      console.log('\n👤 Test 2: Get current user profile');
      const profileResponse = await fetch(`${BASE_URL}/api/profile`);
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        console.log('✅ Current user profile:');
        console.log(`   Name: ${profile.fullName || profile.name || 'Not set'}`);
        console.log(`   Photo: ${profile.photo || profile.image || 'NONE'}`);
        console.log(`   Course: ${profile.course || 'Not set'}`);
        console.log(`   Branch: ${profile.branch || 'Not set'}`);
      } else {
        console.log(`❌ Failed to get current profile: ${profileResponse.status}`);
      }
      
      // Test 3: Get profile by ID
      console.log('\n👤 Test 3: Get profile by ID');
      const profileByIdResponse = await fetch(`${BASE_URL}/api/profile?id=${session.user.id}`);
      
      if (profileByIdResponse.ok) {
        const profile = await profileByIdResponse.json();
        console.log('✅ Profile by ID:');
        console.log(`   Name: ${profile.fullName || profile.name || 'Not set'}`);
        console.log(`   Photo: ${profile.photo || profile.image || 'NONE'}`);
        console.log(`   Course: ${profile.course || 'Not set'}`);
        console.log(`   Branch: ${profile.branch || 'Not set'}`);
      } else {
        console.log(`❌ Failed to get profile by ID: ${profileByIdResponse.status}`);
      }
      
    } else {
      console.log('❌ User not logged in');
      console.log('Cannot test profile API without authentication');
    }
    
    // Test 4: Test with existing comment user IDs
    console.log('\n📝 Test 4: Test with comment user IDs');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      const commentsResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`);
      
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        const uniqueUserIds = [...new Set(commentsData.comments?.map(c => c.userId).filter(Boolean))];
        
        console.log(`Found ${uniqueUserIds.length} unique user IDs in comments`);
        
        for (const userId of uniqueUserIds.slice(0, 3)) { // Test first 3
          console.log(`\nTesting user ID: ${userId}`);
          const userProfileResponse = await fetch(`${BASE_URL}/api/profile?id=${userId}`);
          
          if (userProfileResponse.ok) {
            const profile = await userProfileResponse.json();
            console.log(`✅ Profile found: ${profile.fullName || profile.name || 'Unknown'}`);
            console.log(`   Photo: ${profile.photo || profile.image || 'NONE'}`);
          } else {
            console.log(`❌ Profile not found: ${userProfileResponse.status}`);
          }
        }
      }
    }
    
    console.log('\n✨ PROFILE API TEST COMPLETE!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfileAPI();
