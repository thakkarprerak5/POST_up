// Check which validation pattern is correct for the current data
const BASE_URL = 'http://localhost:3000';

async function checkValidationPattern() {
  console.log('🔍 Checking Validation Patterns...\n');
  
  try {
    // Get projects to see their ID patterns
    const response = await fetch(`${BASE_URL}/api/projects?authenticated=true`);
    const responseText = await response.text();
    
    const jsonStart = responseText.indexOf('[');
    const jsonEnd = responseText.lastIndexOf(']') + 1;
    const projects = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    
    console.log('Current project IDs:');
    projects.forEach((project, index) => {
      const projectId = project._id || project.id;
      const isObjectId = /^[0-9a-f]{24}$/i.test(String(projectId));
      const isNumeric = /^\d+$/.test(String(projectId));
      
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   ID: ${projectId}`);
      console.log(`   Is ObjectId (24 hex chars): ${isObjectId}`);
      console.log(`   Is Numeric: ${isNumeric}`);
      console.log(`   Current UI validation (numeric): ${isNumeric ? '✅ Pass' : '❌ Fail'}`);
      console.log(`   Historical validation (ObjectId): ${isObjectId ? '✅ Pass' : '❌ Fail'}`);
      console.log('---');
    });
    
    // Test with sample projects
    console.log('\n🔍 Testing sample projects...');
    const sampleResponse = await fetch(`${BASE_URL}/api/projects?limit=5`);
    const sampleText = await sampleResponse.text();
    
    const sampleJsonStart = sampleText.indexOf('[');
    const sampleJsonEnd = sampleText.lastIndexOf(']') + 1;
    const sampleProjects = JSON.parse(sampleText.substring(sampleJsonStart, sampleJsonEnd));
    
    const hiddenProjects = sampleProjects.filter(p => 
      !projects.find(real => real._id === p._id)
    );
    
    console.log('Sample projects (hidden):');
    hiddenProjects.forEach((project, index) => {
      const projectId = project._id || project.id;
      const isObjectId = /^[0-9a-f]{24}$/i.test(String(projectId));
      const isNumeric = /^\d+$/.test(String(projectId));
      
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   ID: ${projectId}`);
      console.log(`   Is ObjectId: ${isObjectId}`);
      console.log(`   Is Numeric: ${isNumeric}`);
      console.log('---');
    });
    
    console.log('\n💡 Analysis:');
    console.log('Based on the historical docs, the validation should be:');
    console.log('- ObjectId validation: /^[0-9a-f]{24}$/i.test(String(projectId))');
    console.log('- This matches real MongoDB projects (24 hex chars)');
    console.log('- Sample projects should show "Upload a real project" message');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkValidationPattern();
