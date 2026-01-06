// Debug user ID comparison issue
async function debugUserComparison() {
  try {
    console.log('🔍 Debugging user ID comparison...');
    
    // Get session to see current user
    const response = await fetch('http://localhost:3000/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const userData = await response.json();
    console.log('👤 Current User:', {
      _id: userData._id,
      _idType: typeof userData._id,
      _idString: userData._id ? userData._id.toString() : 'undefined'
    });
    
    // Get project details
    const projectResponse = await fetch('http://localhost:3000/api/projects/693aaf4dc27e95a9fd1a0f05');
    const projectData = await projectResponse.json();
    
    console.log('📦 Project Likes:', {
      likes: projectData.likes,
      likesType: typeof projectData.likes,
      likesLength: projectData.likes ? projectData.likes.length : 0
    });
    
    if (projectData.likes && projectData.likes.length > 0) {
      console.log('🔍 Comparing:');
      console.log('  User ID (string):', userData._id.toString());
      console.log('  Like ID (string):', projectData.likes[0].toString());
      console.log('  Are they equal?', userData._id.toString() === projectData.likes[0].toString());
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugUserComparison();
