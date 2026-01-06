// Test profile photo fetching from user profiles
const BASE_URL = 'http://localhost:3000';

async function testProfilePhotoFetching() {
  console.log('🧪 Testing Profile Photo Fetching from User Profiles...\n');
  
  try {
    // Test 1: Check if user is logged in
    console.log('🔑 Test 1: Check user session');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const session = await sessionResponse.json();
    
    if (session?.user?.email) {
      console.log(`✅ User logged in: ${session.user.email}`);
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   User image: ${session.user.image || 'NONE'}`);
    } else {
      console.log('❌ User not logged in');
      console.log('   → Profile photos will show initials for all comments');
      return;
    }
    
    // Test 2: Check user profile API
    console.log('\n👤 Test 2: Check user profile API');
    const profileResponse = await fetch(`${BASE_URL}/api/profile/${session.user.id}`);
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('✅ User profile data:');
      console.log(`   Name: ${profile.fullName || profile.name || 'NONE'}`);
      console.log(`   Photo: ${profile.photo || profile.image || profile.profile?.photo || 'NONE'}`);
    } else {
      console.log('❌ Failed to fetch user profile');
    }
    
    // Test 3: Add a comment to test profile photo inclusion
    console.log('\n📝 Test 3: Add comment with profile photo');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Project: ${project.title}`);
      
      const addCommentResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Test comment with profile photo fetching',
          userId: session.user.id,
          userName: session.user.name || 'Test User',
          userAvatar: session.user.image || ''
        })
      });
      
      if (addCommentResponse.ok) {
        const newComment = await addCommentResponse.json();
        console.log('✅ Comment added successfully');
        console.log(`   Comment ID: ${newComment.comment.id}`);
        console.log(`   UserAvatar in comment: ${newComment.comment.userAvatar || 'NONE'}`);
      } else {
        const error = await addCommentResponse.json();
        console.log(`❌ Failed to add comment: ${error.error}`);
      }
    }
    
    console.log('\n🎯 EXPECTED BEHAVIOR:');
    console.log('1. Frontend fetches user profiles for all comment authors');
    console.log('2. Shows profile photo if user has uploaded one');
    console.log('3. Shows initials if no profile photo uploaded');
    console.log('4. Prioritizes fetched profile data over comment userAvatar');
    
    console.log('\n📱 HOW TO TEST:');
    console.log('1. Log in with a profile photo uploaded');
    console.log('2. Open comment modal');
    console.log('3. Your comment should show your profile photo');
    console.log('4. Comments from users without photos show initials');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProfilePhotoFetching();
