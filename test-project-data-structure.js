// Test project data structure
console.log('🔍 TESTING PROJECT DATA STRUCTURE\n');

async function testProjectDataStructure() {
  try {
    console.log('📋 Step 1: Testing projects API');
    const response = await fetch('http://localhost:3000/api/projects?limit=10&sort=trending&authenticated=true');
    const projects = await response.json();
    
    console.log(`📊 Found ${projects.length} projects`);
    
    console.log('\n📋 Step 2: Checking first project structure:');
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log('First project title:', firstProject.title);
      console.log('First project author:', JSON.stringify(firstProject.author, null, 2));
      console.log('First project author fields:', Object.keys(firstProject.author || {}));
      console.log('First project author.id:', firstProject.author?.id);
      console.log('First project author._id:', firstProject.author?._id);
      console.log('First project author.authorId:', firstProject.author?.authorId);
      console.log('First project author.userId:', firstProject.author?.userId);
      console.log('---');
    }
    
    console.log('\n📋 Step 3: Checking second project structure:');
    if (projects.length > 1) {
      const secondProject = projects[1];
      console.log('Second project title:', secondProject.title);
      console.log('Second project author:', JSON.stringify(secondProject.author, null, 2));
      console.log('Second project author fields:', Object.keys(secondProject.author || {}));
      console.log('Second project author.id:', secondProject.author?.id);
      console.log('Second project author._id:', secondProject.author?._id);
      console.log('Second project author.authorId:', secondProject.author?.authorId);
      console.log('Second project author.userId:', secondProject.author?.userId);
      console.log('---');
    }
    
    console.log('\n🔧 ANALYSIS:');
    console.log('✅ Need to understand actual data structure');
    console.log('✅ Check which field contains the user ID');
    console.log('✅ Update project-card.tsx to use correct field');
    
    console.log('\n🎉 SUCCESS: Project data structure test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProjectDataStructure();
