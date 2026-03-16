// Check project data for group information
const mongoose = require('mongoose');

async function checkProjectData() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    console.log('Connected to MongoDB');
    
    // Get the project collection directly
    const db = mongoose.connection.db;
    const projectCollection = db.collection('projects');
    
    // Find all projects to see what's available
    const projects = await projectCollection.find({}).toArray();
    console.log(`Found ${projects.length} projects:`);
    
    projects.forEach((project, index) => {
      console.log(`\nProject ${index + 1}:`);
      console.log(`  ID: ${project._id}`);
      console.log(`  Title: ${project.title}`);
      console.log(`  Registration Type: ${project.registrationType}`);
      console.log(`  Has group field: ${!!project.group}`);
      
      if (project.group) {
        console.log(`  Group data:`, JSON.stringify(project.group, null, 4));
      }
      
      // Check if this is the project from the admin assignment request
      if (project._id.toString() === '6973352ed0bd6747551a1c8b') {
        console.log('  *** THIS IS THE PROJECT FROM THE ADMIN ASSIGNMENT REQUEST ***');
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking project data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkProjectData();
