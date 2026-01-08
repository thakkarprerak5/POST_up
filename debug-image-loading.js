// Debug why the profile photo is not loading
async function debugImageLoading() {
  console.log('🖼️ Debugging Image Loading Issue\n');
  
  try {
    // Step 1: Check if the placeholder image exists
    console.log('📋 Step 1: Testing placeholder image URL');
    try {
      const response = await fetch('http://localhost:3000/placeholder-user.jpg');
      console.log(`   Placeholder image status: ${response.status}`);
      if (response.ok) {
        console.log('   ✅ Placeholder image is accessible');
      } else {
        console.log('   ❌ Placeholder image not accessible');
        console.log('   💡 This might be the issue - the image file doesn\'t exist');
      }
    } catch (error) {
      console.log(`   ❌ Error accessing placeholder: ${error.message}`);
    }
    
    // Step 2: Check API response for ganpat's project
    console.log('\n📋 Step 2: Checking API response');
    const apiResponse = await fetch('http://localhost:3000/api/projects');
    const projects = await apiResponse.json();
    const ganpatProject = projects.find(p => p.author?.name === 'ganpat');
    
    if (ganpatProject) {
      console.log('✅ Found ganpat project in API:');
      console.log(`   Title: ${ganpatProject.title}`);
      console.log(`   Author Image: ${ganpatProject.author?.image || 'NOT SET'}`);
      console.log(`   Author Avatar: ${ganpatProject.author?.avatar || 'NOT SET'}`);
      
      // Step 3: Test the actual image URL from API
      if (ganpatProject.author?.image) {
        console.log('\n📋 Step 3: Testing API image URL');
        try {
          const imageResponse = await fetch(`http://localhost:3000${ganpatProject.author.image}`);
          console.log(`   API image URL status: ${imageResponse.status}`);
          if (imageResponse.ok) {
            console.log('   ✅ API image URL is accessible');
          } else {
            console.log('   ❌ API image URL not accessible');
          }
        } catch (error) {
          console.log(`   ❌ Error accessing API image: ${error.message}`);
        }
      }
    } else {
      console.log('❌ Ganpat project not found in API');
    }
    
    // Step 4: Create a simple test with a known working image
    console.log('\n📋 Step 4: Testing with a known working image');
    const testImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRkYiLz4KPHRleHQgeD0iMjAiIHk9IjI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5HPC90ZXh0Pgo8L3N2Zz4K';
    console.log(`   Test image (data URL): ${testImageUrl.substring(0, 50)}...`);
    
    // Step 5: Check the public directory structure
    console.log('\n📋 Step 5: Checking what images exist in public directory');
    const fs = require('fs');
    const path = require('path');
    
    const publicDir = path.join(__dirname, 'public');
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      const imageFiles = files.filter(f => 
        f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.svg') || f.endsWith('.jpeg')
      );
      console.log(`   Found ${imageFiles.length} image files in public directory:`);
      imageFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      
      // Check if placeholder-user.jpg exists
      const placeholderExists = fs.existsSync(path.join(publicDir, 'placeholder-user.jpg'));
      console.log(`   placeholder-user.jpg exists: ${placeholderExists ? '✅' : '❌'}`);
      
      if (!placeholderExists) {
        console.log('\n🔧 Creating placeholder-user.jpg...');
        // Create a simple SVG placeholder and save it as JPG base64
        const svgPlaceholder = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="20" cy="20" r="20" fill="#E5E7EB"/>
<text x="20" y="25" text-anchor="middle" font-size="14" fill="#6B7280">G</text>
</svg>`;
        
        fs.writeFileSync(path.join(publicDir, 'placeholder-user.jpg'), Buffer.from(svgPlaceholder));
        console.log('   ✅ Created placeholder-user.jpg');
      }
    } else {
      console.log('   ❌ Public directory not found');
    }
    
    console.log('\n🎯 DEBUG SUMMARY:');
    console.log('1. Check if placeholder image file exists');
    console.log('2. Verify API is returning correct image URL');
    console.log('3. Test if image URL is accessible');
    console.log('4. Check browser console for image loading errors');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Refresh the browser after creating placeholder image');
    console.log('2. Check browser console (F12) for image loading errors');
    console.log('3. Verify the image path in network tab');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugImageLoading();
