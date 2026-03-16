// Debug script to check project IDs and like functionality
console.log('🔍 Debugging Like Functionality...');

// Check current projects on the page
const projectCards = document.querySelectorAll('[data-project-id]');
console.log('📦 Found project cards:', projectCards.length);

projectCards.forEach((card, index) => {
  const projectId = card.getAttribute('data-project-id');
  console.log(`Project ${index + 1}:`, {
    projectId: projectId,
    isValidObjectId: /^[0-9a-f]{24}$/i.test(projectId),
    type: typeof projectId,
    length: projectId ? projectId.length : 'null'
  });
});

// Test a like API call manually (replace with actual project ID)
const testProjectId = '507f1f77bcf86cd799439011'; // Example valid ObjectId
console.log('🧪 Testing like API with valid ID...');

fetch(`/api/projects/${testProjectId}/like`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Test API Response Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📊 Test API Response:', data);
})
.catch(error => {
  console.error('❌ Test API Error:', error);
});

// Check if user is logged in
fetch('/api/auth/session')
.then(response => response.json())
.then(session => {
  console.log('👤 User Session:', {
    hasSession: !!session,
    hasEmail: !!session?.user?.email,
    email: session?.user?.email || 'No email'
  });
})
.catch(error => {
  console.error('❌ Session check error:', error);
});
