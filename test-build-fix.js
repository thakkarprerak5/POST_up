// Quick test to check if build error is fixed
const BASE_URL = 'http://localhost:3000';

async function testBuildFix() {
  try {
    console.log('Testing like endpoint...');
    const response = await fetch(`${BASE_URL}/api/projects/693aaf4dc27e95a9fd1a0f05/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Like endpoint working!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Like endpoint still failing');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testBuildFix();
