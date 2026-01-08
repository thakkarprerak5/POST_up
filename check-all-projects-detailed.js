const mongoose = require('mongoose');

async function checkAllProjectsDetailed() {
  try {
    console.log('🔍 Detailed Check of All Projects\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    const allProjects = await projectsCollection.find({}).toArray();
    console.log(`📊 Found ${allProjects.length} projects in database`);
    
    if (allProjects.length === 0) {
      console.log('❌ No projects in database');
      
      // Check API vs database discrepancy
      console.log('\n🌐 Checking API vs Database...');
      try {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/api/projects');
        if (response.ok) {
          const apiProjects = await response.json();
          console.log(`✅ API returns ${apiProjects.length} projects`);
          
          if (apiProjects.length > 0) {
            console.log('\n📋 Projects from API:');
            apiProjects.forEach((project, index) => {
              console.log(`   ${index + 1}. ${project.title} by ${project.author?.name || 'Unknown'}`);
              console.log(`      Author ID: ${project.author?.id}`);
              console.log(`      Author Name: ${project.author?.name}`);
              console.log(`      Author Image: ${project.author?.image || 'NOT SET'}`);
            });
            
            // Look for ganpat in API results
            const ganpatFromAPI = apiProjects.find(p => 
              p.author?.name?.toLowerCase().includes('ganpat')
            );
            
            if (ganpatFromAPI) {
              console.log('\n✅ Found Ganpat in API results:');
              console.log(`   Project: ${ganpatFromAPI.title}`);
              console.log(`   Author ID: ${ganpatFromAPI.author?.id}`);
              console.log(`   Author Name: ${ganpatFromAPI.author?.name}`);
              
              // Now create this project in the database
              console.log('\n🔧 Creating missing project in database...');
              const newProject = {
                title: ganpatFromAPI.title,
                description: 'Project uploaded by ganpat',
                tags: ['Web Development'],
                images: [],
                githubUrl: '',
                liveUrl: '',
                author: {
                  id: ganpatFromAPI.author?.id,
                  name: ganpatFromAPI.author?.name,
                  image: ganpatFromAPI.author?.image || '/placeholder-user.jpg'
                },
                likes: [],
                likeCount: 0,
                comments: [],
                shares: [],
                shareCount: 0,
                createdAt: new Date(),
                isDeleted: false
              };
              
              const result = await projectsCollection.insertOne(newProject);
              console.log('✅ Project created in database!');
              console.log(`   Project ID: ${result.insertedId}`);
              console.log(`   Author ID: ${newProject.author.id}`);
              
            } else {
              console.log('❌ Ganpat not found in API results either');
            }
          }
        }
      } catch (error) {
        console.log(`❌ API check failed: ${error.message}`);
      }
      
    } else {
      console.log('\n📋 Projects in Database:');
      allProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title} by ${project.author?.name || 'Unknown'}`);
        console.log(`      Author ID: ${project.author?.id}`);
        console.log(`      Author Name: ${project.author?.name}`);
        console.log(`      Author Image: ${project.author?.image || 'NOT SET'}`);
      });
      
      // Look for ganpat in database
      const ganpatInDB = allProjects.find(p => 
        p.author?.name?.toLowerCase().includes('ganpat')
      );
      
      if (ganpatInDB) {
        console.log('\n✅ Found Ganpat in database:');
        console.log(`   Project: ${ganpatInDB.title}`);
        console.log(`   Author ID: ${ganpatInDB.author?.id}`);
      } else {
        console.log('\n❌ Ganpat not found in database either');
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllProjectsDetailed();
