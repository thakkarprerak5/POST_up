// Test script for activity stats API
console.log('🧪 Testing Activity Stats API...');

// Test the API endpoint
fetch('/api/user/activity-stats')
  .then(response => {
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('✅ API Response:', data);
    
    // Validate the response structure
    const expectedFields = ['totalProjects', 'projectsThisMonth', 'totalMinutesSpent'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    console.log('🔍 Validation:');
    console.log('  Has all required fields:', hasAllFields);
    console.log('  Total Projects:', data.totalProjects);
    console.log('  Projects This Month:', data.projectsThisMonth);
    console.log('  Total Minutes:', data.totalMinutesSpent);
    console.log('  User ID:', data.userId);
    console.log('  Calculated At:', data.calculatedAt);
    
    if (hasAllFields && typeof data.totalProjects === 'number') {
      console.log('✅ API test PASSED');
    } else {
      console.log('❌ API test FAILED');
    }
  })
  .catch(error => {
    console.error('❌ API test ERROR:', error);
  });

// Also test with different scenarios
console.log('\n🔄 Testing edge cases...');

// Test unauthorized access
fetch('/api/user/activity-stats', {
  method: 'GET',
  headers: {
    'Cookie': '' // Clear session
  }
})
.then(response => {
  console.log('🔒 Unauthorized test - Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('🔒 Unauthorized response:', data);
})
.catch(error => {
  console.log('🔒 Unauthorized error (expected):', error.message);
});
