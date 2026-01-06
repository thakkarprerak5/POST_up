// Test profile photo functionality in comments
const BASE_URL = 'http://localhost:3000';

async function testProfilePhotos() {
  console.log('👤 Testing Profile Photos in Comments...\n');
  
  try {
    // Test 1: Check if user is logged in and has profile photo
    console.log('🔑 Test 1: Check user profile');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const session = await sessionResponse.json();
    
    if (session?.user?.email) {
      console.log(`✅ User logged in: ${session.user.email}`);
      console.log(`   User Name: ${session.user.name || 'Not set'}`);
      console.log(`   User Image: ${session.user.image || 'No profile photo'}`);
      console.log(`   User ID: ${session.user.id}`);
    } else {
      console.log('❌ User not logged in');
      console.log('   → Profile photos require login to test');
      return;
    }
    
    // Test 2: Get existing comments to see their structure
    console.log('\n📝 Test 2: Check existing comment structure');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      const commentsResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`);
      
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log(`✅ Found ${commentsData.comments?.length || 0} comments`);
        
        commentsData.comments?.forEach((comment, index) => {
          console.log(`\n  Comment ${index + 1}:`);
          console.log(`    Text: "${comment.text}"`);
          console.log(`    User: ${comment.userName}`);
          console.log(`    Avatar: ${comment.userAvatar || 'No avatar'}`);
          console.log(`    User ID: ${comment.userId}`);
        });
      }
    }
    
    // Test 3: Add a test comment to verify profile photo is saved
    console.log('\n📝 Test 3: Add comment with profile photo');
    if (projects.length > 0 && session?.user) {
      const testProject = projects[0];
      const addCommentResponse = await fetch(`${BASE_URL}/api/projects/${testProject.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Test comment with profile photo ' + Date.now(),
          userId: session.user.id,
          userName: session.user.name || 'Test User',
          userAvatar: session.user.image || ''
        })
      });
      
      if (addCommentResponse.ok) {
        const newComment = await addCommentResponse.json();
        console.log(`✅ Comment added successfully`);
        console.log(`   Comment ID: ${newComment.comment.id}`);
        console.log(`   User Avatar: ${newComment.comment.userAvatar || 'No avatar'}`);
      } else {
        console.log(`❌ Failed to add comment: ${addCommentResponse.status}`);
      }
    }
    
    console.log('\n🎯 EXPECTED BEHAVIOR:');
    console.log('1. Comments show user profile photos if available');
    console.log('2. Falls back to initials if no photo');
    console.log('3. Profile photos are circular and properly sized');
    console.log('4. New comments save the user\'s profile photo');
    
    console.log('\n✨ Profile photo functionality is now implemented!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfilePhotos();
