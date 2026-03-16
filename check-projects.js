const mongoose = require('mongoose');
const { connectDB } = require('./lib/db');

async function checkProjects() {
  try {
    await connectDB();
    const Project = require('./models/Project');
    
    const projects = await Project.find({}).limit(10);
    console.log('Total projects found:', projects.length);
    
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`);
      console.log(`  Title: ${project.title}`);
      console.log(`  Images: ${project.images ? project.images.length : 0}`);
      console.log(`  Likes: ${project.likes ? project.likes.length : 0}`);
      console.log(`  Comments: ${project.comments ? project.comments.length : 0}`);
      console.log(`  Shares: ${project.shareCount || 0}`);
      console.log(`  Status: ${project.projectStatus || 'undefined'}`);
      console.log(`  Has Images: ${project.images && project.images.length > 0}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProjects();
