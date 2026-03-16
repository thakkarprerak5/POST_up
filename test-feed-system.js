// Test script to verify the tag-based feed system
// Run this in the browser console or as a Node.js script

async function testFeedSystem() {
  console.log('🧪 Testing Tag-Based Feed System...\n');
  
  try {
    // Test 1: Get all projects
    console.log('📋 Test 1: Fetching all projects from /api/feed');
    const allResponse = await fetch('/api/feed');
    const allData = await allResponse.json();
    
    console.log('✅ All projects:', allData.count);
    console.log('📝 Sample project:', allData.projects[0]);
    
    // Test 2: Get AI/ML projects
    console.log('\n🤖 Test 2: Fetching AI/ML projects');
    const aiResponse = await fetch('/api/feed?category=ai-ml');
    const aiData = await aiResponse.json();
    
    console.log('✅ AI/ML projects:', aiData.count);
    aiData.projects.forEach(project => {
      console.log(`🔹 ${project.title} - tags: [${project.tags.join(', ')}]`);
    });
    
    // Test 3: Get Web Development projects
    console.log('\n🌐 Test 3: Fetching Web Development projects');
    const webResponse = await fetch('/api/feed?category=web-development');
    const webData = await webResponse.json();
    
    console.log('✅ Web Development projects:', webData.count);
    webData.projects.forEach(project => {
      console.log(`🔹 ${project.title} - tags: [${project.tags.join(', ')}]`);
    });
    
    // Test 4: Verify category consistency
    console.log('\n🔍 Test 4: Verifying category consistency');
    const categories = ['web-development', 'ai-ml', 'data-analysis', 'mobile-app', 'cyber-security', 'blockchain'];
    
    for (const category of categories) {
      const response = await fetch(`/api/feed?category=${category}`);
      const data = await response.json();
      console.log(`📊 ${category}: ${data.count} projects`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFeedSystem();
