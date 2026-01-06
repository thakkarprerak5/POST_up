// Quick test to see debug output
const BASE_URL = 'http://localhost:3000';

async function quickTest() {
  try {
    const response = await fetch(`${BASE_URL}/api/projects/693aaf4dc27e95a9fd1a0f05`);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      console.log('Response error:', response.status);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

quickTest();
