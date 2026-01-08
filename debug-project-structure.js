// Debug project data structure
console.log('🔍 DEBUGGING PROJECT DATA STRUCTURE\n');

async function debugProjectStructure() {
  try {
    console.log('📋 Step 1: Testing API response');
    const response = await fetch('http://localhost:3000/api/projects?limit=10&sort=trending&authenticated=true');
    const projects = await response.json();
    
    console.log(`📊 Found ${projects.length} projects`);
    console.log('\n📋 Step 2: Checking complete project structure:');
    
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project: "${project.title}"`);
      console.log('   Complete project object:', JSON.stringify(project, null, 2));
      console.log('   Author object:', JSON.stringify(project.author, null, 2));
      console.log('   Author ID:', project.author?.id);
      console.log('   Author ID type:', typeof project.author?.id);
      console.log('   Author name:', project.author?.name);
      console.log('   Available author fields:', Object.keys(project.author || {}));
      console.log('   ---');
    });
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ Need to understand exact data structure');
    console.log('✅ Check if author.id exists in project object');
    console.log('✅ Check if author.name exists in project object');
    console.log('✅ Check if there are any nested properties');
    console.log('✅ Check if data is being passed correctly');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Analyze project data structure');
    console.log('2. Fix project-card.tsx to use correct fields');
    console.log('3. Test navigation again');
    console.log('4. Verify it works correctly');
    
    console.log('\n🎉 DEBUGGING COMPLETE!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProjectStructure();
