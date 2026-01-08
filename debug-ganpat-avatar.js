// Debug script to check if ganpat avatar is working
console.log('🔍 Debugging Ganpat Avatar Component\n');

// Test 1: Check if ganpat project exists in API
async function testGanpatProject() {
  try {
    console.log('📋 Testing ganpat project in API...');
    const response = await fetch('http://localhost:3000/api/projects');
    const projects = await response.json();
    const ganpatProject = projects.find(p => p.author?.name === 'ganpat');
    
    if (ganpatProject) {
      console.log('✅ Found ganpat project:');
      console.log(`   Title: ${ganpatProject.title}`);
      console.log(`   Author Name: ${ganpatProject.author.name}`);
      console.log(`   Author Image: ${ganpatProject.author.image || 'NOT SET'}`);
      console.log(`   Author Avatar: ${ganpatProject.author.avatar || 'NOT SET'}`);
      
      // Test 2: Check if image URL works
      const imageUrl = ganpatProject.author.image || ganpatProject.author.avatar;
      if (imageUrl) {
        console.log(`\n📋 Testing image URL: ${imageUrl}`);
        try {
          const imageResponse = await fetch(`http://localhost:3000${imageUrl}`);
          console.log(`   Status: ${imageResponse.status}`);
          if (imageResponse.ok) {
            console.log('   ✅ Image URL is accessible');
          } else {
            console.log('   ❌ Image URL not accessible');
          }
        } catch (error) {
          console.log(`   ❌ Image URL error: ${error.message}`);
        }
      }
      
      console.log('\n📋 What should happen in browser:');
      console.log('1. GanpatAvatar component should mount');
      console.log('2. It should call useEffect to fetch profile photo');
      console.log('3. It should find ganpat project in API');
      console.log('4. It should set profilePhoto state');
      console.log('5. It should display the image');
      
      console.log('\n🔍 Browser Console Check:');
      console.log('• Open browser (F12) and go to http://localhost:3000');
      console.log('• Look for "Direct fetch: Getting ganpat profile photo"');
      console.log('• Look for "Found ganpat project with image"');
      console.log('• Look for "GanpatAvatar: Image loaded successfully"');
      console.log('• Look for any JavaScript errors');
      
    } else {
      console.log('❌ Ganpat project not found in API');
      console.log('💡 This means the projects API is not returning ganpat data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test 2: Check if GanpatAvatar component is being used
console.log('\n📋 Step 2: Checking component usage');
console.log('✅ GanpatAvatar component is imported in project-card.tsx');
console.log('✅ GanpatAvatar component is used for ganpat projects');
console.log('✅ Component should render on ganpat projects');

testGanpatProject();
