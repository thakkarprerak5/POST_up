// Check the actual comment data structure
const BASE_URL = 'http://localhost:3000';

async function checkCommentData() {
  console.log('🔍 Checking Comment Data Structure...\n');
  
  try {
    // Get projects and check comments
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsResponse.json();
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Project: ${project.title}`);
      
      const commentsResponse = await fetch(`${BASE_URL}/api/projects/${project.id}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log(`\n📝 Found ${commentsData.comments?.length || 0} comments:`);
        
        commentsData.comments?.forEach((comment, index) => {
          console.log(`\nComment ${index + 1}:`);
          console.log(`  Full object:`, JSON.stringify(comment, null, 2));
          console.log(`  userAvatar: ${comment.userAvatar}`);
          console.log(`  user?.image: ${comment.user?.image}`);
          console.log(`  userName: ${comment.userName}`);
          console.log(`  userId: ${comment.userId}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkCommentData();
