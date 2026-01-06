// Test the like functionality
async function testLike() {
  try {
    console.log('🧪 Testing like functionality...');
    
    // Test the like endpoint
    const response = await fetch('http://localhost:3000/api/projects/693aaf4dc27e95a9fd1a0f05/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('📊 Response:', data);
    
    if (data.success) {
      console.log('✅ Like functionality working!');
      console.log(`📈 Like count: ${data.likeCount}`);
      console.log(`❤️ Liked status: ${data.liked}`);
    } else {
      console.log('❌ Like functionality failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLike();
