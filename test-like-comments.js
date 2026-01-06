// Test script for like and comments functionality

const BASE_URL = 'http://localhost:3000';

async function testLikeAndComments() {
  console.log('🧪 Testing Like and Comments API...\n');
  
  try {
    // Test 1: Check if we can access a project
    console.log('📦 Testing project access...');
    const projectsResponse = await fetch(`${BASE_URL}/api/projects`);
    const projectsText = await projectsResponse.text();
    console.log('Raw response length:', projectsText.length);
    
    let projectsData;
    try {
      // Try to parse as JSON, handling potential extra content
      const jsonStart = projectsText.indexOf('[');
      const jsonEnd = projectsText.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = projectsText.substring(jsonStart, jsonEnd);
        projectsData = JSON.parse(jsonPart);
      } else {
        projectsData = JSON.parse(projectsText);
      }
    } catch (error) {
      console.error('Failed to parse projects response:', error.message);
      console.log('Response preview:', projectsText.substring(0, 200));
      return;
    }
    
    if (Array.isArray(projectsData) && projectsData.length > 0) {
      const testProject = projectsData[0];
      console.log(`✅ Found test project: ${testProject.title} (ID: ${testProject._id || testProject.id})`);
      
      const projectId = testProject._id || testProject.id;
      
      // Test 2: Check like status (should work without auth for testing)
      console.log('\n👍 Testing check-like endpoint...');
      try {
        const checkLikeResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/check-like`);
        console.log(`Status: ${checkLikeResponse.status}`);
        if (checkLikeResponse.status === 401) {
          console.log('✅ Check-like endpoint correctly requires authentication');
        } else {
          const checkLikeData = await checkLikeResponse.json();
          console.log('Response:', checkLikeData);
        }
      } catch (error) {
        console.log('❌ Check-like endpoint error:', error.message);
      }
      
      // Test 3: Test like endpoint (should work without auth for testing)
      console.log('\n💝 Testing like endpoint...');
      try {
        const likeResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/like`, {
          method: 'POST'
        });
        console.log(`Status: ${likeResponse.status}`);
        if (likeResponse.status === 401) {
          console.log('✅ Like endpoint correctly requires authentication');
        } else {
          const likeData = await likeResponse.json();
          console.log('Response:', likeData);
        }
      } catch (error) {
        console.log('❌ Like endpoint error:', error.message);
      }
      
      // Test 4: Test comments endpoint
      console.log('\n💬 Testing comments endpoint...');
      try {
        const commentsResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/comments`);
        const commentsData = await commentsResponse.json();
        console.log(`Status: ${commentsResponse.status}`);
        if (commentsResponse.ok) {
          console.log(`✅ Comments endpoint working. Found ${commentsData.comments?.length || 0} comments`);
          console.log('Comments:', commentsData.comments);
        } else {
          console.log('❌ Comments endpoint error:', commentsData);
        }
      } catch (error) {
        console.log('❌ Comments endpoint error:', error.message);
      }
      
      // Test 5: Test posting a comment (should require auth)
      console.log('\n📝 Testing post comment endpoint...');
      try {
        const postCommentResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: 'Test comment',
            userId: 'test-user',
            userName: 'Test User'
          })
        });
        console.log(`Status: ${postCommentResponse.status}`);
        if (postCommentResponse.status === 401) {
          console.log('✅ Post comment endpoint correctly requires authentication');
        } else {
          const postCommentData = await postCommentResponse.json();
          console.log('Response:', postCommentData);
        }
      } catch (error) {
        console.log('❌ Post comment endpoint error:', error.message);
      }
      
    } else {
      console.log('❌ No projects found for testing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testLikeAndComments();
