// Check the specific comment that has no avatar
const BASE_URL = 'http://localhost:3000';

async function checkSpecificComment() {
  console.log('🔍 Checking Specific Comment: 1767421834590\n');
  
  try {
    // Get projects and find this specific comment
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Project: ${project.title}`);
      
      const commentsResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log(`Found ${commentsData.comments?.length || 0} comments`);
        
        // Find the specific comment
        const targetComment = commentsData.comments?.find(c => c.id === '1767421834590');
        
        if (targetComment) {
          console.log('\n📝 Target Comment Found:');
          console.log('Full object:', JSON.stringify(targetComment, null, 2));
          console.log(`userAvatar: "${targetComment.userAvatar}"`);
          console.log(`user?.image: ${targetComment.user?.image}`);
          console.log(`userName: ${targetComment.userName}`);
          console.log(`userId: ${targetComment.userId}`);
          console.log(`text: "${targetComment.text}"`);
          
          // Check if this is the current user's comment
          console.log('\n🔑 Checking user session...');
          const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
          const session = await sessionResponse.json();
          
          if (session?.user?.email) {
            console.log(`Current user: ${session.user.email}`);
            console.log(`Current user ID: ${session.user.id}`);
            console.log(`Current user image: ${session.user.image || 'NONE'}`);
            console.log(`Is this user's comment: ${targetComment.userId === session.user.id}`);
            
            if (targetComment.userId === session.user.id && session.user.image) {
              console.log('\n🔧 FIXING: This is the current user\'s comment but missing their profile photo');
              console.log('I need to update this comment with the user\'s profile photo');
              
              // Update the comment with the user's profile photo
              const updateResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments/${targetComment.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: targetComment.text,
                  userAvatar: session.user.image
                })
              });
              
              if (updateResponse.ok) {
                console.log('✅ Comment updated with profile photo!');
              } else {
                const error = await updateResponse.json();
                console.log(`❌ Failed to update comment: ${error.error}`);
              }
            }
          } else {
            console.log('❌ User not logged in or no profile photo');
          }
        } else {
          console.log('❌ Comment not found');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkSpecificComment();
