// Debug profile photos issue
console.log('🔍 DEBUGGING PROFILE PHOTOS ISSUE\n');

async function debugProfilePhotos() {
  try {
    console.log('📋 Step 1: Testing API response');
    const response = await fetch('http://localhost:3000/api/projects?limit=10&sort=trending&authenticated=true');
    const projects = await response.json();
    
    console.log(`📊 Found ${projects.length} projects`);
    console.log('\n📋 Step 2: Checking all users\' profile photos:');
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.author?.name}`);
      console.log(`   Image: ${project.author?.image || 'NOT SET'}`);
      console.log(`   Avatar: ${project.author?.avatar || 'NOT SET'}`);
      console.log(`   Has actual photo: ${project.author?.image && project.author?.image !== '/placeholder-user.jpg' ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    // Test ganpat specifically
    const ganpatProject = projects.find(p => p.author?.name === 'ganpat');
    if (ganpatProject) {
      console.log('📋 Step 3: Testing ganpat\'s uploaded photo');
      try {
        const photoResponse = await fetch('http://localhost:3000/uploads/ganpat-profile-photo.jpg');
        console.log(`   Status: ${photoResponse.status}`);
        if (photoResponse.ok) {
          console.log('   ✅ Ganpat\'s uploaded photo is accessible');
        } else {
          console.log('   ❌ Ganpat\'s uploaded photo not accessible');
        }
      } catch (error) {
        console.log(`   ❌ Photo error: ${error.message}`);
      }
    }
    
    console.log('\n🔍 POSSIBLE ISSUES:');
    console.log('1. Frontend logic not working correctly');
    console.log('2. Avatar component not rendering');
    console.log('3. Image URLs not being passed correctly');
    console.log('4. CSS hiding the images');
    console.log('5. JavaScript errors in browser');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Check browser console for errors');
    console.log('2. Check Network tab for image requests');
    console.log('3. Check Elements panel for HTML structure');
    console.log('4. Add debug elements to see what\'s happening');
    console.log('5. Test with simple HTML to isolate issue');
    
    console.log('\n🎯 DEBUG STRATEGY:');
    console.log('1. Add visible debug elements to see if conditional logic works');
    console.log('2. Test with simple HTML img tags');
    console.log('3. Check if Avatar component is rendering');
    console.log('4. Verify image URLs are correct');
    console.log('5. Check for CSS issues');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProfilePhotos();
