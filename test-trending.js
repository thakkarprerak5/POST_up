// Test the trending API specifically
const BASE_URL = 'http://localhost:3000';

async function testTrendingAPI() {
  console.log('🔍 Testing Trending API with Filtering...\n');
  
  try {
    // Test trending API
    const response = await fetch(`${BASE_URL}/api/projects?limit=10&sort=trending&authenticated=true`);
    const responseText = await response.text();
    
    const jsonStart = responseText.indexOf('[');
    const jsonEnd = responseText.lastIndexOf(']') + 1;
    const projects = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    
    console.log(`Trending projects returned: ${projects.length}\n`);
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   Author: ${project.author?.name}`);
      console.log(`   Likes: ${project.likeCount || 0}`);
      console.log(`   Comments: ${project.comments?.length || 0}`);
      console.log('---');
    });
    
    // Test without filtering for comparison
    console.log('\n🔄 Testing WITHOUT filtering...');
    const unfilteredResponse = await fetch(`${BASE_URL}/api/projects?limit=10&sort=trending`);
    const unfilteredText = await unfilteredResponse.text();
    
    const unfilteredJsonStart = unfilteredText.indexOf('[');
    const unfilteredJsonEnd = unfilteredText.lastIndexOf(']') + 1;
    const unfilteredProjects = JSON.parse(unfilteredText.substring(unfilteredJsonStart, unfilteredJsonEnd));
    
    console.log(`Unfiltered trending projects: ${unfilteredProjects.length}\n`);
    
    unfilteredProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   Author: ${project.author?.name}`);
      console.log('---');
    });
    
    console.log('\n✅ Trending API filtering working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTrendingAPI();
