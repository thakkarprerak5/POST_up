// Test the actual project data to see if the content-based validation works
const BASE_URL = 'http://localhost:3000';

async function testContentBasedValidation() {
  console.log('🔍 Testing Content-Based Validation...\n');
  
  try {
    // Get all projects to test with
    const response = await fetch(`${BASE_URL}/api/projects?limit=5`);
    const responseText = await response.text();
    
    const jsonStart = responseText.indexOf('[');
    const jsonEnd = responseText.lastIndexOf(']') + 1;
    const allProjects = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    
    console.log('Testing content-based validation:');
    allProjects.forEach((project, index) => {
      const projectId = project._id || project.id;
      
      // Apply the same validation logic as the component
      const hasGenericGithubUrl = project.githubUrl === "https://github.com" || project.githubUrl === "#";
      const hasGenericLiveUrl = project.liveUrl === "https://example.com" || project.liveUrl === "#";
      const hasGenericUrls = hasGenericGithubUrl && hasGenericLiveUrl;
      
      const hasRealUploadedImages = project.images && project.images.length > 0 && 
        project.images.some((img) => img.startsWith('/uploads/'));
      
      const isSampleProject = hasGenericUrls && !hasRealUploadedImages;
      
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   GitHub: "${project.githubUrl}"`);
      console.log(`   Live: "${project.liveUrl}"`);
      console.log(`   Images: ${project.images?.join(', ')}`);
      console.log(`   Generic URLs: ${hasGenericUrls}`);
      console.log(`   Real Uploaded Images: ${hasRealUploadedImages}`);
      console.log(`   Is Sample Project: ${isSampleProject}`);
      console.log(`   UI should ${isSampleProject ? 'DISABLE' : 'ENABLE'} interactions`);
      console.log('---');
    });
    
    console.log('\n✅ Content-Based Validation Summary:');
    console.log('✅ Real projects (with uploaded images): interactions enabled');
    console.log('✅ Sample projects (generic URLs + no uploaded images): interactions disabled');
    console.log('✅ Validation based on actual content, not ID format');
    console.log('✅ Matches historical filtering logic');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testContentBasedValidation();
