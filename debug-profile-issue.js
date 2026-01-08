// Debug why ganpat's project isn't showing in profile
async function debugProfileIssue() {
  console.log('🔍 Debugging Ganpat Profile Issue\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Step 1: Test ganpat login
    console.log('🔑 Step 1: Testing ganpat login');
    const loginResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ganpat@example.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      console.log('✅ Login successful');
    } else {
      const error = await loginResponse.json();
      console.log(`❌ Login failed: ${error.error}`);
      console.log('💡 Try with ganpat\'s actual password');
    }
    
    // Step 2: Check what projects API returns for ganpat
    console.log('\n📁 Step 2: Testing different user project endpoints');
    
    const userIds = [
      '695f41e4fbaf7a179f771541', // ganpat's user ID
      '693becc696e13382a825371',  // old author ID from API
    ];
    
    for (const userId of userIds) {
      console.log(`\n   Testing user ID: ${userId}`);
      try {
        const response = await fetch(`${baseUrl}/api/users/${userId}/projects`);
        if (response.ok) {
          const projects = await response.json();
          console.log(`   ✅ Found ${projects.length} projects`);
          projects.forEach((project, index) => {
            console.log(`      ${index + 1}. ${project.title}`);
          });
        } else {
          console.log(`   ❌ Failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Step 3: Check all projects API to see ganpat's project
    console.log('\n📋 Step 3: Checking all projects for ganpat');
    try {
      const allProjectsResponse = await fetch(`${baseUrl}/api/projects`);
      if (allProjectsResponse.ok) {
        const allProjects = await allProjectsResponse.json();
        console.log(`✅ Found ${allProjects.length} total projects`);
        
        const ganpatProjects = allProjects.filter(p => 
          p.author?.name?.toLowerCase().includes('ganpat')
        );
        
        if (ganpatProjects.length > 0) {
          console.log(`✅ Found ${ganpatProjects.length} projects by ganpat:`);
          ganpatProjects.forEach((project, index) => {
            console.log(`   ${index + 1}. ${project.title}`);
            console.log(`      Author ID: ${project.author?.id}`);
            console.log(`      Author Name: ${project.author?.name}`);
            console.log(`      Author Image: ${project.author?.image || 'NOT SET'}`);
          });
          
          // Test user projects API with the author ID from the project
          const projectAuthorId = ganpatProjects[0].author?.id;
          if (projectAuthorId) {
            console.log(`\n🔄 Step 4: Testing with project author ID: ${projectAuthorId}`);
            const userProjectsResponse = await fetch(`${baseUrl}/api/users/${projectAuthorId}/projects`);
            if (userProjectsResponse.ok) {
              const userProjects = await userProjectsResponse.json();
              console.log(`✅ Found ${userProjects.length} projects with author ID`);
              userProjects.forEach((project, index) => {
                console.log(`   ${index + 1}. ${project.title}`);
              });
            } else {
              console.log(`❌ Failed with author ID: ${userProjectsResponse.status}`);
            }
          }
        } else {
          console.log('❌ No projects found by ganpat in API');
        }
      }
    } catch (error) {
      console.log(`❌ API check failed: ${error.message}`);
    }
    
    // Step 4: Check database directly
    console.log('\n🗄️ Step 5: Checking database directly');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Find ganpat user
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    if (ganpatUser) {
      console.log('✅ Found ganpat user in database:');
      console.log(`   User ID: ${ganpatUser._id}`);
      console.log(`   Email: ${ganpatUser.email}`);
      
      // Find projects by this user
      const userProjects = await projectsCollection.find({ 'author.id': ganpatUser._id.toString() }).toArray();
      console.log(`✅ Found ${userProjects.length} projects in database for this user`);
      userProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title}`);
      });
      
      // Also check for projects with ganpat name
      const ganpatNamedProjects = await projectsCollection.find({ 'author.name': 'ganpat' }).toArray();
      console.log(`✅ Found ${ganpatNamedProjects.length} projects with ganpat name`);
      ganpatNamedProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title} (author.id: ${project.author?.id})`);
      });
    } else {
      console.log('❌ Ganpat user not found in database');
    }
    
    await mongoose.disconnect();
    
    console.log('\n🎯 DEBUG SUMMARY:');
    console.log('1. Check if ganpat can login successfully');
    console.log('2. Verify which user ID returns projects');
    console.log('3. Check if API and database are consistent');
    console.log('4. Test the profile page directly in browser');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProfileIssue();
