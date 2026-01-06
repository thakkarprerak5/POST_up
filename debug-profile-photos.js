// Debug profile photo issues in comments
const BASE_URL = 'http://localhost:3000';

async function debugProfilePhotos() {
  console.log('🔍 Debugging Profile Photo Issues...\n');
  
  try {
    // Test 1: Check user session and profile photo
    console.log('🔑 Test 1: Check user session and profile');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const session = await sessionResponse.json();
    
    if (session?.user?.email) {
      console.log(`✅ User logged in: ${session.user.email}`);
      console.log(`   Name: ${session.user.name || 'Not set'}`);
      console.log(`   Image: ${session.user.image || 'NO PROFILE PHOTO'}`);
      console.log(`   ID: ${session.user.id}`);
      
      if (!session.user.image) {
        console.log('⚠️  WARNING: User has no profile photo set');
        console.log('   → This might be why photos aren\'t showing');
      }
    } else {
      console.log('❌ User not logged in');
      return;
    }
    
    // Test 2: Check existing comments structure
    console.log('\n📝 Test 2: Check existing comments data');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Project: ${project.title}`);
      
      const commentsResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log(`Found ${commentsData.comments?.length || 0} comments`);
        
        commentsData.comments?.forEach((comment, index) => {
          console.log(`\nComment ${index + 1}:`);
          console.log(`  Text: "${comment.text}"`);
          console.log(`  UserName: ${comment.userName}`);
          console.log(`  UserAvatar: "${comment.userAvatar || 'EMPTY'}"`);
          console.log(`  User.Image: "${comment.user?.image || 'EMPTY'}"`);
          console.log(`  UserID: ${comment.userId}`);
          
          // Check if this comment should have a photo
          if (comment.userId === session.user.id) {
            console.log(`  🎯 This is the current user's comment`);
            console.log(`  Expected photo: ${session.user.image || 'NONE'}`);
            console.log(`  Actual photo: ${comment.userAvatar || 'NONE'}`);
          }
        });
      }
    }
    
    // Test 3: Add a new comment to test photo saving
    console.log('\n📝 Test 3: Add new comment to test photo saving');
    if (projects.length > 0 && session?.user) {
      const testProject = projects[0];
      const testText = `Test comment for photo debug ${Date.now()}`;
      
      console.log(`Adding comment: "${testText}"`);
      console.log(`With photo: ${session.user.image || 'NONE'}`);
      
      const addCommentResponse = await fetch(`${BASE_URL}/api/projects/${testProject.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          userId: session.user.id,
          userName: session.user.name || 'Test User',
          userAvatar: session.user.image || ''
        })
      });
      
      if (addCommentResponse.ok) {
        const newComment = await addCommentResponse.json();
        console.log(`✅ Comment added successfully`);
        console.log(`   Saved photo: "${newComment.comment.userAvatar || 'NONE'}"`);
        
        // Check if photo was saved correctly
        if (session.user.image && newComment.comment.userAvatar === session.user.image) {
          console.log(`✅ Photo saved correctly!`);
        } else if (!session.user.image) {
          console.log(`⚠️  No photo to save (user has no profile photo)`);
        } else {
          console.log(`❌ Photo mismatch!`);
          console.log(`   Expected: ${session.user.image}`);
          console.log(`   Got: ${newComment.comment.userAvatar}`);
        }
      } else {
        const error = await addCommentResponse.json();
        console.log(`❌ Failed to add comment: ${error.error}`);
      }
    }
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check if user has a profile photo set');
    console.log('2. Verify photo URLs are accessible');
    console.log('3. Check browser console for image loading errors');
    console.log('4. Verify Avatar component is rendering correctly');
    
    console.log('\n📋 POSSIBLE ISSUES:');
    console.log('- User has no profile photo set');
    console.log('- Photo URL is invalid or inaccessible');
    console.log('- Avatar component not rendering correctly');
    console.log('- CSS styling hiding the images');
    console.log('- Browser caching issues');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProfilePhotos();
