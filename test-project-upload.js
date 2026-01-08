// Test project upload functionality
async function testProjectUpload() {
  console.log('🧪 Testing Project Upload Functionality\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, let's check if we can access the upload page
    console.log('📋 Step 1: Testing upload page access');
    const uploadPageResponse = await fetch(`${baseUrl}/upload`);
    console.log(`   Upload page status: ${uploadPageResponse.status}`);
    
    // Test the upload API endpoint with sample data
    console.log('\n📤 Step 2: Testing upload API endpoint');
    
    // Create form data for testing
    const formData = new FormData();
    formData.append('title', 'Test Project Upload');
    formData.append('description', 'This is a test project to verify upload functionality');
    formData.append('githubUrl', 'https://github.com/test/project');
    formData.append('liveUrl', 'https://test-project.example.com');
    formData.append('tags', 'test, upload, functionality');
    
    // Note: We'll test without images first to isolate the user data issue
    
    console.log('   Sending test upload request...');
    
    const uploadResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData - browser sets it automatically with boundary
    });
    
    console.log(`   Upload response status: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('   ✅ Upload successful!');
      console.log(`   Project ID: ${result._id}`);
      console.log(`   Project Title: ${result.title}`);
      console.log(`   Author ID: ${result.author?.id}`);
      console.log(`   Author Name: ${result.author?.name}`);
      
      // Test if the new project appears in user projects
      if (result.author?.id) {
        console.log('\n👤 Step 3: Testing if new project appears in user profile');
        const userProjectsResponse = await fetch(`${baseUrl}/api/users/${result.author.id}/projects`);
        const userProjects = await userProjectsResponse.json();
        
        const newProjectInProfile = userProjects.some(p => p._id === result._id);
        console.log(`   New project in user profile: ${newProjectInProfile ? '✅ Yes' : '❌ No'}`);
        console.log(`   Total user projects: ${userProjects.length}`);
      }
      
    } else {
      const errorData = await uploadResponse.json();
      console.log('   ❌ Upload failed!');
      console.log(`   Error: ${errorData.error || 'Unknown error'}`);
      
      if (uploadResponse.status === 401) {
        console.log('   💡 This suggests an authentication issue');
        console.log('   💡 Make sure you are logged in before uploading');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProjectUpload();
