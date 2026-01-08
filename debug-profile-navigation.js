// Debug profile navigation issue
console.log('🔍 DEBUGGING PROFILE NAVIGATION ISSUE\n');

async function debugProfileNavigation() {
  try {
    console.log('📋 Step 1: Testing API response');
    const response = await fetch('http://localhost:3000/api/projects?limit=10&sort=trending&authenticated=true');
    const projects = await response.json();
    
    console.log(`📊 Found ${projects.length} projects`);
    console.log('\n📋 Step 2: Checking user IDs and navigation:');
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.author?.name}'s project: "${project.title}"`);
      console.log(`   Author ID: ${project.author?.id || 'NOT SET'}`);
      console.log(`   Author ID Type: ${typeof project.author?.id}`);
      console.log(`   Profile URL: /profile/${project.author?.id || 'NO_ID'}`);
      console.log(`   Should navigate to: ${project.author?.id ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    console.log('🔍 POSSIBLE ISSUES:');
    console.log('1. Author ID might be undefined or null');
    console.log('2. Link component might not be working');
    console.log('3. Profile route might not be handling the ID correctly');
    console.log('4. Navigation might be blocked by something');
    console.log('5. User ID format might be wrong');
    
    console.log('\n🔧 DEBUGGING STEPS:');
    console.log('1. Check if author.id is defined');
    console.log('2. Check if Link component is rendering correctly');
    console.log('3. Check browser console for errors');
    console.log('4. Check network tab for navigation requests');
    console.log('5. Test with hardcoded URL');
    
    console.log('\n🎯 QUICK TEST:');
    console.log('Try navigating directly to:');
    console.log('• http://localhost:3000/profile/69327a20497d40e9eb1cd438 (thakkar prerak)');
    console.log('• http://localhost:3000/profile/6932becc696e13382a825371 (ganpat)');
    console.log('See if these URLs work directly');
    
    console.log('\n📋 WHAT TO CHECK IN BROWSER:');
    console.log('1. Right-click on author name and "Inspect Element"');
    console.log('2. Check if it\'s an <a> tag with correct href');
    console.log('3. Check browser console for JavaScript errors');
    console.log('4. Check Network tab when clicking');
    console.log('5. See if navigation request is made');
    
    console.log('\n🎉 DEBUG INFORMATION READY!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProfileNavigation();
