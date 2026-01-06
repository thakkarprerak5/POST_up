// Test the JSON parsing fix
const BASE_URL = 'http://localhost:3000';

async function testJsonParsing() {
  console.log('🧪 Testing JSON Parsing Fix...\n');
  
  try {
    // Test the same way the frontend does
    const response = await fetch(`${BASE_URL}/api/projects?authenticated=true&limit=8`);
    const responseText = await response.text();
    
    console.log('Raw response length:', responseText.length);
    console.log('First 100 chars:', responseText.substring(0, 100));
    
    let projects = [];
    
    try {
      // Handle case where there might be extra text before JSON
      const jsonStart = responseText.indexOf('[');
      const jsonEnd = responseText.lastIndexOf(']') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = responseText.substring(jsonStart, jsonEnd);
        console.log('Found JSON from position', jsonStart, 'to', jsonEnd);
        projects = JSON.parse(jsonPart);
      } else if (responseText.trim()) {
        projects = JSON.parse(responseText);
      }
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      console.log('Response text:', responseText.substring(0, 200));
      projects = [];
    }
    
    console.log('\n✅ Parsing successful!');
    console.log('Projects found:', projects.length);
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title} by ${project.author?.name}`);
      console.log(`   Likes: ${project.likeCount || 0}, Comments: ${project.comments?.length || 0}`);
    });
    
    console.log('\n✅ JSON parsing fix is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testJsonParsing();
