// Simple test for admin assignment
console.log('🧪 Testing admin assignment flow...');

// Test 1: Check if process-assignments API exists
fetch('http://localhost:3000/api/admin/process-assignments')
  .then(response => {
    console.log('✅ Process-assignments API is reachable');
    return response.json();
  })
  .catch(error => {
    console.error('❌ Process-assignments API is not reachable:', error);
  });

// Test 2: Check if assignment-requests API exists
fetch('http://localhost:3000/api/admin/assignment-requests')
  .then(response => {
    console.log('✅ Assignment-requests API is reachable');
    return response.json();
  })
  .catch(error => {
    console.error('❌ Assignment-requests API is not reachable:', error);
  });

console.log('🧪 Test completed');
