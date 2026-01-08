// Debug project data to find correct user ID field
console.log('🔍 DEBUGGING PROJECT DATA TO FIND CORRECT USER ID FIELD\n');

async function debugProjectData() {
  try {
    console.log('📋 Step 1: Testing API response');
    const response = await fetch('http://localhost:3000/api/projects?limit=10&sort=trending&authenticated=true');
    const projects = await response.json();
    
    console.log(`📊 Found ${projects.length} projects`);
    console.log('\n📋 Step 2: Checking project data structure:');
    
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project: "${project.title}"`);
      console.log('   Author object:', JSON.stringify(project.author, null, 2));
      console.log('   Available fields:', Object.keys(project.author || {}));
      console.log('   Author ID (project.author.id):', project.author.id);
      console.log('   Author _id (project.author._id):', project.author._id);
      console.log('   Author ID type:', typeof project.author.id);
      console.log('   Author _id type:', typeof project.author._id);
      console.log('   Any ID field:', Object.keys(project.author || {}).find(key => key.toLowerCase().includes('id')));
    });
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ Need to find which field contains the user ID');
    console.log('✅ Check if it\'s id, _id, or something else');
    console.log('✅ Update project-card.tsx to use correct field');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Identify correct user ID field');
    console.log('2. Update project-card.tsx to use correct field');
    console.log('3. Test navigation again');
    console.log('4. Verify it works correctly');
    
    console.log('\n🎉 DEBUGGING COMPLETE!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProjectData();
