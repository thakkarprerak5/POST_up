// Debug the profile photo issue in real-time
async function debugProfilePhotoLive() {
  console.log('🔍 Debugging Profile Photo Issue Live\n');
  
  try {
    // Step 1: Check what the API is actually returning
    console.log('📋 Step 1: Checking API Response');
    const response = await fetch('http://localhost:3000/api/projects');
    const projects = await response.json();
    
    console.log(`✅ Found ${projects.length} projects in API`);
    
    const ganpatProject = projects.find(p => 
      p.author?.name?.toLowerCase().includes('ganpat')
    );
    
    if (ganpatProject) {
      console.log('✅ Found ganpat project in API:');
      console.log(`   Title: ${ganpatProject.title}`);
      console.log(`   Author Name: ${ganpatProject.author?.name}`);
      console.log(`   Author ID: ${ganpatProject.author?.id}`);
      console.log(`   Author Image: ${ganpatProject.author?.image || 'NOT SET'}`);
      console.log(`   Author Avatar: ${ganpatProject.author?.avatar || 'NOT SET'}`);
      
      // Step 2: Check if the image URL is accessible
      if (ganpatProject.author?.image) {
        console.log('\n🖼️ Step 2: Testing Image URL');
        try {
          const imageResponse = await fetch(`http://localhost:3000${ganpatProject.author.image}`);
          console.log(`   Image URL Status: ${imageResponse.status}`);
          if (imageResponse.ok) {
            console.log('   ✅ Image URL is accessible');
          } else {
            console.log('   ❌ Image URL not accessible');
          }
        } catch (error) {
          console.log(`   ❌ Image URL error: ${error.message}`);
        }
      }
      
      // Step 3: Check database directly
      console.log('\n🗄️ Step 3: Checking Database');
      const mongoose = require('mongoose');
      await mongoose.connect('mongodb://localhost:27017/post-up');
      const db = mongoose.connection.db;
      const projectsCollection = db.collection('projects');
      
      const dbProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
      if (dbProject) {
        console.log('✅ Found ganpat project in database:');
        console.log(`   Title: ${dbProject.title}`);
        console.log(`   Author: ${JSON.stringify(dbProject.author, null, 2)}`);
      }
      
      await mongoose.disconnect();
      
      // Step 4: Create a simple HTML test
      console.log('\n🌐 Step 4: Creating HTML Test');
      const htmlTest = `
<!DOCTYPE html>
<html>
<head>
    <title>Profile Photo Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; }
        .author-info { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🖼️ Profile Photo Test</h1>
    
    <div class="test">
        <h3>API Data Test</h3>
        <div class="author-info">
            ${ganpatProject.author.image ? 
                `<img src="${ganpatProject.author.image}" alt="${ganpatProject.author.name}" class="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : 
                ''
            }
            <div style="display: ${ganpatProject.author.image ? 'none' : 'flex'}; width: 40px; height: 40px; background: #ccc; border-radius: 50%; align-items: center; justify-content: center;">
                ${ganpatProject.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <div><strong>${ganpatProject.author.name}</strong></div>
                <small>Image: ${ganpatProject.author.image || 'NOT SET'}</small>
                <br>
                <small>Avatar: ${ganpatProject.author.avatar || 'NOT SET'}</small>
            </div>
        </div>
    </div>
    
    <div class="test">
        <h3>Manual Image Test</h3>
        <div class="author-info">
            <img src="/placeholder-user.jpg" alt="Placeholder" class="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div style="display: none; width: 40px; height: 40px; background: #ccc; border-radius: 50%; align-items: center; justify-content: center;">
                P
            </div>
            <div>
                <div><strong>Manual Test</strong></div>
                <small>Testing /placeholder-user.jpg directly</small>
            </div>
        </div>
    </div>
    
    <script>
        console.log('Page loaded');
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            img.addEventListener('load', () => console.log(\`Image \${index + 1} loaded successfully\`));
            img.addEventListener('error', () => console.log(\`Image \${index + 1} failed to load\`));
        });
    </script>
</body>
</html>`;
      
      require('fs').writeFileSync('profile-photo-test.html', htmlTest);
      console.log('✅ Created profile-photo-test.html');
      console.log('   Open this file in your browser to test the image loading');
      
    } else {
      console.log('❌ Ganpat project not found in API');
      console.log('📊 Available authors:');
      const authors = [...new Set(projects.map(p => p.author?.name).filter(Boolean))];
      authors.forEach((author, index) => {
        console.log(`   ${index + 1}. ${author}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProfilePhotoLive();
