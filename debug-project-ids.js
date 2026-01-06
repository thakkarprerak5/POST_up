// Debug script to check project ID formats
const BASE_URL = 'http://localhost:3000';

async function debugProjectIds() {
  console.log('🔍 Debugging Project ID Formats...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/projects`);
    if (response.ok) {
      const projects = await response.json();
      console.log(`Found ${projects.length} projects:\n`);
      
      projects.forEach((project, index) => {
        console.log(`Project ${index + 1}:`);
        console.log(`  Title: ${project.title}`);
        console.log(`  ID: ${project.id}`);
        console.log(`  _id: ${project._id}`);
        console.log(`  ID type: ${typeof project.id}`);
        console.log(`  _id type: ${typeof project._id}`);
        console.log(`  ID length: ${project.id?.length || 'N/A'}`);
        console.log(`  _id length: ${project._id?.length || 'N/A'}`);
        console.log(`  Is valid ObjectId: /^[0-9a-f]{24}$/i.test(String(project.id)): /^[0-9a-f]{24}$/i.test(String(project._id))`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProjectIds();
