// Check all comments and add a test with profile photo
const BASE_URL = 'http://localhost:3000';

async function checkAllAndAddTest() {
  console.log('🔍 Checking All Comments & Adding Test\n');
  
  try {
    // Get current comments
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Project: ${project.title}`);
      
      const commentsResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log(`\n📝 Current Comments (${commentsData.comments?.length || 0}):`);
        
        commentsData.comments?.forEach((comment, index) => {
          console.log(`${index + 1}. ID: ${comment.id}, User: ${comment.userName}, Avatar: ${comment.userAvatar || 'NONE'}`);
        });
      }
      
      // Check user session
      console.log('\n🔑 Checking user session...');
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
      const session = await sessionResponse.json();
      
      if (session?.user?.email) {
        console.log(`Current user: ${session.user.email}`);
        console.log(`User image: ${session.user.image || 'NONE'}`);
        
        if (session.user.image) {
          console.log('\n🧪 Adding test comment with user\'s profile photo...');
          
          // Add a new comment with the user's actual profile photo
          const addCommentResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: 'Test comment with my actual profile photo',
              userId: session.user.id,
              userName: session.user.name || 'Current User',
              userAvatar: session.user.image
            })
          });
          
          if (addCommentResponse.ok) {
            const newComment = await addCommentResponse.json();
            console.log('✅ Test comment added successfully!');
            console.log(`   Comment ID: ${newComment.comment.id}`);
            console.log(`   Photo URL: ${newComment.comment.userAvatar}`);
            console.log(`   Should show 📷 indicator and actual photo`);
          } else {
            const error = await addCommentResponse.json();
            console.log(`❌ Failed to add comment: ${error.error}`);
          }
        } else {
          console.log('\n❌ User has no profile photo to test with');
          console.log('Please upload a profile photo first');
        }
      } else {
        console.log('\n❌ User not logged in');
        console.log('Please log in to test profile photos');
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAllAndAddTest();
