const mongoose = require('mongoose');

async function verifyExistingProjects() {
  try {
    console.log('🔍 Verifying Existing Projects Structure\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');
    
    const projects = await projectsCollection.find({}).toArray();
    console.log(`📊 Found ${projects.length} projects in database`);
    
    if (projects.length > 0) {
      console.log('\n📋 Project Analysis:');
      
      for (let index = 0; index < projects.length; index++) {
        const project = projects[index];
        console.log(`\n   ${index + 1}. ${project.title}`);
        console.log(`      Author ID: ${project.author?.id || 'MISSING'}`);
        console.log(`      Author Name: ${project.author?.name || 'MISSING'}`);
        console.log(`      Author Image: ${project.author?.image ? '✅' : '❌'}`);
        
        // Check if author ID matches any user
        if (project.author?.id) {
          const authorUser = await usersCollection.findOne({ _id: project.author.id });
          console.log(`      Author in Users DB: ${authorUser ? '✅' : '❌'}`);
          if (authorUser) {
            console.log(`      Author Email: ${authorUser.email}`);
          }
        }
      }
    }
    
    console.log('\n✅ Verification Complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyExistingProjects();
