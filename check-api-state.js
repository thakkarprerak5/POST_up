// Simple script to restore like using API
const BASE_URL = 'http://localhost:3000';

async function restoreLikeUsingAPI() {
  try {
    console.log('🔄 Restoring original like using API...');
    
    // Get the First Project
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projectsText = await projectsResponse.text();
    
    // Parse the JSON response
    const jsonStart = projectsText.indexOf('[');
    const jsonEnd = projectsText.lastIndexOf(']') + 1;
    const projectsData = JSON.parse(projectsText.substring(jsonStart, jsonEnd));
    
    const firstProject = projectsData.find(p => p.title === 'First Project');
    
    if (!firstProject) {
      console.log('❌ First Project not found');
      return;
    }
    
    console.log('Found First Project:', firstProject.title);
    console.log('Current likeCount:', firstProject.likeCount);
    console.log('Current likes array:', firstProject.likes);
    
    // The project should have the original like from user 69327a20497d40e9eb1cd438
    // Let's check if we can manually update it through a direct API call
    
    console.log('\n✅ Original data check completed');
    console.log('The comments are still intact:', firstProject.comments?.length || 0);
    console.log('The shares are still intact:', firstProject.shareCount || 0);
    
    // The issue might be just in the display - let me check the project detail API
    const projectDetailResponse = await fetch(`${BASE_URL}/api/projects/${firstProject._id}`);
    if (projectDetailResponse.ok) {
      const projectDetail = await projectDetailResponse.json();
      console.log('\n📋 Project Detail API Response:');
      console.log('  likeCount:', projectDetail.likeCount);
      console.log('  likes array length:', projectDetail.likes?.length || 0);
      console.log('  likedByUser:', projectDetail.likedByUser);
      console.log('  comments count:', projectDetail.comments?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreLikeUsingAPI();
