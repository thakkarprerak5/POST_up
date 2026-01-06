// Test the project details API to check likedByUser
async function testProjectDetails() {
  try {
    console.log('🧪 Testing project details API...');
    
    // Test the project details endpoint
    const response = await fetch('http://localhost:3000/api/projects/693aaf4dc27e95a9fd1a0f05', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('📊 Project Response:', {
      title: data.title,
      likeCount: data.likeCount,
      likedByUser: data.likedByUser,
      likes: data.likes
    });
    
    if (data.error) {
      console.log('❌ Project details failed:', data.error);
    } else {
      console.log('✅ Project details retrieved!');
      console.log(`📈 Like count: ${data.likeCount}`);
      console.log(`❤️ Liked by user: ${data.likedByUser}`);
      console.log(`👥 Likes array length: ${data.likes ? data.likes.length : 'undefined'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProjectDetails();
