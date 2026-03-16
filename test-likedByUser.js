// Test script to verify likedByUser functionality
console.log('🧪 Testing likedByUser functionality...');

// Test 1: Check main projects API
console.log('\n📡 Testing main projects API...');
fetch('/api/projects?limit=5')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Main API Response:');
    data.forEach((project, index) => {
      console.log(`  Project ${index + 1}: ${project.title}`);
      console.log(`    - likeCount: ${project.likeCount}`);
      console.log(`    - likedByUser: ${project.likedByUser}`);
      console.log(`    - has likedByUser field: ${project.hasOwnProperty('likedByUser')}`);
    });
  })
  .catch(error => {
    console.error('❌ Main API Error:', error);
  });

// Test 2: Check home projects API
console.log('\n📡 Testing home projects API...');
fetch('/api/home/projects')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Home API Response:');
    if (data.projects && Array.isArray(data.projects)) {
      data.projects.slice(0, 3).forEach((project, index) => {
        console.log(`  Project ${index + 1}: ${project.title}`);
        console.log(`    - likeCount: ${project.likeCount}`);
        console.log(`    - likedByUser: ${project.likedByUser}`);
        console.log(`    - has likedByUser field: ${project.hasOwnProperty('likedByUser')}`);
      });
    } else {
      console.log('❌ Invalid response structure:', data);
    }
  })
  .catch(error => {
    console.error('❌ Home API Error:', error);
  });

// Test 3: Check user session
console.log('\n👤 Testing user session...');
fetch('/api/auth/session')
  .then(response => response.json())
  .then(session => {
    console.log('✅ Session Response:');
    console.log(`  - Has session: ${!!session}`);
    console.log(`  - Has user: ${!!session?.user}`);
    console.log(`  - Has email: ${!!session?.user?.email}`);
    console.log(`  - Email: ${session?.user?.email || 'None'}`);
  })
  .catch(error => {
    console.error('❌ Session Error:', error);
  });

// Test 4: Test like functionality
console.log('\n👍 Testing like functionality...');
// First get a project ID
fetch('/api/projects?limit=1')
  .then(response => response.json())
  .then(projects => {
    if (projects.length > 0) {
      const projectId = projects[0]._id || projects[0].id;
      console.log(`Testing like on project: ${projectId}`);
      
      // Test like API
      return fetch(`/api/projects/${projectId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      throw new Error('No projects found');
    }
  })
  .then(response => {
    console.log('Like API Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Like API Response:', data);
  })
  .catch(error => {
    console.error('❌ Like API Error:', error);
  });

console.log('\n🎯 Test completed! Check the results above.');
