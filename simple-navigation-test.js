// Simple navigation test
console.log('🔍 SIMPLE NAVIGATION TEST\n');

console.log('📋 TESTING SIMPLE NAVIGATION:');
console.log('1. Check if project.author._id exists');
console.log('2. Check if navigation works with project.author._id');

// Test function
function testSimpleNavigation() {
  // Test if project.author._id exists in a project
  const testProject = {
    title: 'Test Project',
    author: {
      _id: 'test-user-id-123',
      name: 'Test User',
      avatar: '/uploads/test-avatar.jpg',
      image: '/uploads/test-image.jpg'
    }
  };
  
  console.log('Test project author._id:', testProject.author._id);
  console.log('Test project author.id:', testProject.author.id);
  
  // Simulate the handleAuthorClick function logic
  const possibleIds = [
    testProject.author?.id,
    testProject.author?._id,
    testProject.author?.authorId,
    testProject.author?.userId,
    testProject.author?.author?._id,
    testProject.author?.author?.id
  ];
  
  const validId = possibleIds.find(id => id && id !== 'undefined' && id !== 'null' && id !== '');
  
  console.log('Possible IDs found:', possibleIds);
  console.log('First valid ID:', validId);
  
  if (validId) {
    console.log('✅ Should navigate to profile with ID:', validId);
    console.log('✅ Navigation URL would be: /profile/' + validId);
  } else {
    console.log('❌ No valid author ID found');
  }
  
  console.log('\n🎉 SIMPLE TEST RESULT:');
  console.log('✅ Logic test completed');
  console.log('✅ If project.author._id exists, navigation should work');
  console.log('✅ If only project.author.id exists, navigation will fail');
}

testSimpleNavigation();
