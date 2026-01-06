// Test API response for specific project
const BASE_URL = 'http://localhost:3000';

async function testSpecificProject() {
  console.log('🔍 Testing API Response for First Project...\n');
  
  try {
    // Get all projects
    const response = await fetch(`${BASE_URL}/api/projects`);
    const projects = await response.json();
    
    // Find First Project
    const firstProject = projects.find(p => p.title === 'First Project');
    
    if (!firstProject) {
      console.log('❌ First Project not found in API response');
      return;
    }
    
    console.log('📦 API Response for First Project:');
    console.log(`  Title: ${firstProject.title}`);
    console.log(`  ID: ${firstProject.id}`);
    console.log(`  _id: ${firstProject._id}`);
    console.log(`  Like Count: ${firstProject.likeCount}`);
    console.log(`  Liked By User: ${firstProject.likedByUser}`);
    console.log(`  Likes Array: [${(firstProject.likes || []).join(', ')}]`);
    console.log(`  Likes Length: ${(firstProject.likes || []).length}`);
    console.log(`  Author: ${JSON.stringify(firstProject.author)}`);
    console.log(`  Images: ${JSON.stringify(firstProject.images || [])}`);
    console.log(`  GitHub URL: ${firstProject.githubUrl}`);
    console.log(`  Live URL: ${firstProject.liveUrl}`);
    
    // Test individual project endpoint
    console.log('\n🔍 Testing Individual Project Endpoint:');
    const individualResponse = await fetch(`${BASE_URL}/api/projects/${firstProject.id}`);
    const individualProject = await individualResponse.json();
    
    console.log('📦 Individual API Response:');
    console.log(`  Title: ${individualProject.title}`);
    console.log(`  Like Count: ${individualProject.likeCount}`);
    console.log(`  Liked By User: ${individualProject.likedByUser}`);
    console.log(`  Likes Array: [${(individualProject.likes || []).join(', ')}]`);
    console.log(`  Likes Length: ${(individualProject.likes || []).length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSpecificProject();
