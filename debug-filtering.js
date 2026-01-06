// Debug the filtering logic for each project
const BASE_URL = 'http://localhost:3000';

async function debugFiltering() {
  console.log('🔍 Debugging Filtering Logic...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/projects?authenticated=true&limit=8`);
    const responseText = await response.text();
    
    const jsonStart = responseText.indexOf('[');
    const jsonEnd = responseText.lastIndexOf(']') + 1;
    const projects = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    
    console.log(`Projects returned by API: ${projects.length}\n`);
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title}`);
      
      // Check the filtering criteria
      const hasRealUploadedImages = project.images && project.images.length > 0 && 
        project.images.some((img) => img.startsWith('/uploads/'));
      
      const hasGenericGithubUrl = project.githubUrl === "https://github.com" || project.githubUrl === "#";
      const hasGenericLiveUrl = project.liveUrl === "https://example.com" || project.liveUrl === "#";
      const hasGenericUrls = hasGenericGithubUrl && hasGenericLiveUrl;
      
      const hasGenericImages = project.images && project.images.length > 0 && 
        project.images.some((img) => img.includes('generic-') || img.includes('placeholder'));
      
      const shouldShow = hasRealUploadedImages || !hasGenericUrls || !hasGenericImages;
      
      console.log(`   GitHub: "${project.githubUrl}" -> Generic: ${hasGenericGithubUrl}`);
      console.log(`   Live: "${project.liveUrl}" -> Generic: ${hasGenericLiveUrl}`);
      console.log(`   Generic URLs: ${hasGenericUrls}`);
      console.log(`   Generic Images: ${hasGenericImages}`);
      console.log(`   Real Uploaded Images: ${hasRealUploadedImages}`);
      console.log(`   Should Show: ${shouldShow}`);
      console.log(`   Images: ${project.images?.join(', ')}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugFiltering();
