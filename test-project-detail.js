// Test the project detail page API response
const BASE_URL = 'http://localhost:3000';

async function testProjectDetailPage() {
  console.log('🔍 Testing Project Detail Page API...\n');
  
  try {
    // First, get a project ID from the list
    const listResponse = await fetch(`${BASE_URL}/api/projects`);
    const projects = await listResponse.json();
    const firstProject = projects.find(p => p.title === 'First Project');
    
    if (!firstProject) {
      console.log('❌ First Project not found');
      return;
    }
    
    console.log(`Testing project detail for: ${firstProject.title} (ID: ${firstProject.id})`);
    
    // Test the individual project endpoint
    const detailResponse = await fetch(`${BASE_URL}/api/projects/${firstProject.id}`);
    console.log(`Detail API Status: ${detailResponse.status}`);
    
    if (detailResponse.ok) {
      const projectDetail = await detailResponse.json();
      
      console.log('\n📦 Project Detail Response:');
      console.log(`  Title: ${projectDetail.title}`);
      console.log(`  Like Count: ${projectDetail.likeCount}`);
      console.log(`  Liked By User: ${projectDetail.likedByUser}`);
      console.log(`  Likes Array: [${(projectDetail.likes || []).join(', ')}]`);
      console.log(`  Likes Length: ${(projectDetail.likes || []).length}`);
      console.log(`  Author: ${JSON.stringify(projectDetail.author)}`);
      console.log(`  Images: ${JSON.stringify(projectDetail.images || [])}`);
      console.log(`  GitHub URL: ${projectDetail.githubUrl}`);
      console.log(`  Live URL: ${projectDetail.liveUrl}`);
      
      // Check if this would be detected as sample project
      const hasGenericGithubUrl = projectDetail.githubUrl === "https://github.com" || projectDetail.githubUrl === "#";
      const hasGenericLiveUrl = projectDetail.liveUrl === "https://example.com" || projectDetail.liveUrl === "#";
      const hasGenericUrls = hasGenericGithubUrl && hasGenericLiveUrl;
      
      const hasRealUploadedImages = projectDetail.images && projectDetail.images.length > 0 && 
        projectDetail.images.some(function(img) { return img.startsWith('/uploads/'); });
      
      const isSampleProject = hasGenericUrls && !hasRealUploadedImages;
      
      console.log('\n🔍 Sample Project Detection:');
      console.log(`  Has Generic GitHub URL: ${hasGenericGithubUrl}`);
      console.log(`  Has Generic Live URL: ${hasGenericLiveUrl}`);
      console.log(`  Has Generic URLs: ${hasGenericUrls}`);
      console.log(`  Has Real Uploaded Images: ${hasRealUploadedImages}`);
      console.log(`  Is Sample Project: ${isSampleProject}`);
      
      console.log('\n✅ Project Detail API is working correctly!');
      
    } else {
      const errorData = await detailResponse.json();
      console.log(`❌ Detail API Error: ${JSON.stringify(errorData)}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testProjectDetailPage();
