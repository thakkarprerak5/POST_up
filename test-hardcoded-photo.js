// Test profile photo with hardcoded image
const BASE_URL = 'http://localhost:3000';

async function testHardcodedProfilePhoto() {
  console.log('🧪 Testing with Hardcoded Profile Photo...\n');
  
  try {
    // Get a project to test with
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length === 0) {
      console.log('❌ No projects found');
      return;
    }
    
    const testProject = projects[0];
    console.log(`Testing with project: ${testProject.title}`);
    
    // Add a comment with a hardcoded profile photo URL
    const hardcodedPhotoUrl = 'https://picsum.photos/100/100'; // Random photo
    console.log(`Using hardcoded photo: ${hardcodedPhotoUrl}`);
    
    const addCommentResponse = await fetch(`${BASE_URL}/api/projects/${testProject.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Test comment with hardcoded profile photo',
        userId: 'test-user-123',
        userName: 'Test User',
        userAvatar: hardcodedPhotoUrl
      })
    });
    
    if (addCommentResponse.ok) {
      const newComment = await addCommentResponse.json();
      console.log('✅ Comment added with hardcoded photo');
      console.log(`   Comment ID: ${newComment.comment.id}`);
      console.log(`   Photo URL: ${newComment.comment.userAvatar}`);
      
      console.log('\n🎯 WHAT TO CHECK:');
      console.log('1. Open the comment modal');
      console.log('2. Look for the new comment "Test comment with hardcoded profile photo"');
      console.log('3. Check if it shows a profile photo or initials');
      console.log('4. Look for debug info below the avatar');
      console.log('5. Check browser console for loading messages');
      
      console.log('\n📋 EXPECTED RESULTS:');
      console.log('✅ If hardcoded photo shows → Avatar component works');
      console.log('❌ If still shows initials → Issue with Avatar component');
      console.log('📷 Debug indicator should show 📷 for this comment');
      
    } else {
      const error = await addCommentResponse.json();
      console.log(`❌ Failed to add comment: ${error.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testHardcodedProfilePhoto();
