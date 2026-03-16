const fetch = require('node-fetch');

async function testMentorAPI() {
  try {
    console.log('🔍 Testing mentor invitations API...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3001/api/mentor/invitations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // This won't work without real session
      }
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMentorAPI();
