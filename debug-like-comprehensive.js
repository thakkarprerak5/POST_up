// Comprehensive debug script for like functionality
const BASE_URL = 'http://localhost:3000';

async function debugLikeIssue() {
  console.log('🔍 Comprehensive Like Debug...\n');
  
  try {
    // Step 1: Get projects
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    if (!projectsResponse.ok) {
      console.log('❌ Failed to fetch projects');
      return;
    }
    
    const projects = await projectsResponse.json();
    console.log(`✅ Found ${projects.length} projects\n`);
    
    if (projects.length === 0) {
      console.log('❌ No projects found');
      return;
    }
    
    const firstProject = projects[0];
    console.log('📦 First Project Details:');
    console.log(`  Title: ${firstProject.title}`);
    console.log(`  ID: ${firstProject.id}`);
    console.log(`  Like Count: ${firstProject.likeCount}`);
    console.log(`  Liked By User: ${firstProject.likedByUser}`);
    console.log(`  GitHub URL: ${firstProject.githubUrl}`);
    console.log(`  Live URL: ${firstProject.liveUrl}`);
    console.log(`  Images: ${JSON.stringify(firstProject.images || [])}`);
    
    // Check if it's detected as sample project
    const hasGenericGithubUrl = firstProject.githubUrl === "https://github.com" || firstProject.githubUrl === "#";
    const hasGenericLiveUrl = firstProject.liveUrl === "https://example.com" || firstProject.liveUrl === "#";
    const hasGenericUrls = hasGenericGithubUrl && hasGenericLiveUrl;
    
    const hasRealUploadedImages = firstProject.images && firstProject.images.length > 0 && 
      firstProject.images.some(function(img) { return img.startsWith('/uploads/'); });
    
    const isSampleProject = hasGenericUrls && !hasRealUploadedImages;
    
    console.log(`\n🔍 Sample Project Detection:`);
    console.log(`  Has Generic GitHub URL: ${hasGenericGithubUrl}`);
    console.log(`  Has Generic Live URL: ${hasGenericLiveUrl}`);
    console.log(`  Has Generic URLs: ${hasGenericUrls}`);
    console.log(`  Has Real Uploaded Images: ${hasRealUploadedImages}`);
    console.log(`  Is Sample Project: ${isSampleProject}`);
    
    // Step 2: Test like endpoint directly
    console.log(`\n🧪 Testing Like Endpoint:`);
    console.log(`  Project ID: ${firstProject.id}`);
    console.log(`  Valid ObjectId: /^[0-9a-f]{24}$/i.test(String(firstProject.id)): ${/^[0-9a-f]{24}$/i.test(String(firstProject.id))}`);
    
    if (!/^[0-9a-f]{24}$/i.test(String(firstProject.id))) {
      console.log(`  ❌ Project ID is not a valid ObjectId format`);
    } else {
      console.log(`  ✅ Project ID is valid ObjectId format`);
      
      if (isSampleProject) {
        console.log(`  ❌ Would be blocked by sample project check`);
      } else {
        console.log(`  ✅ Would pass sample project check`);
      }
    }
    
    // Step 3: Check if user is logged in by testing a protected endpoint
    console.log(`\n🔑 Checking Authentication:`);
    try {
      const testResponse = await fetch(`${BASE_URL}/api/projects/${firstProject.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const testData = await testResponse.json();
      console.log(`  Like endpoint response: ${testResponse.status}`);
      console.log(`  Response: ${JSON.stringify(testData)}`);
      
      if (testResponse.status === 401) {
        console.log(`  ❌ User not authenticated`);
      } else if (testResponse.status === 400) {
        console.log(`  ❌ Bad request - likely sample project or invalid ID`);
      } else {
        console.log(`  ✅ Like endpoint accessible`);
      }
    } catch (error) {
      console.log(`  ❌ Error testing like endpoint: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLikeIssue();
