// Simple test to check if PUT route is accessible
async function testPUTRoute() {
  try {
    console.log('🧪 Testing PUT route...');
    
    const response = await fetch('http://localhost:3000/api/mentor/invitations/696f5c39d0d7d552dc586a96', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'accepted', responseMessage: '' }),
    });

    console.log('🧪 PUT test response status:', response.status);
    console.log('🧪 PUT test response ok:', response.ok);
    
    const result = await response.text();
    console.log('🧪 PUT test response body:', result);
    
  } catch (error) {
    console.error('🧪 PUT test error:', error);
  }
}

testPUTRoute();
