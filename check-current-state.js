const { connectDB } = require('./lib/db');
const Project = require('./models/Project');

async function checkCurrentState() {
  try {
    await connectDB();
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects`);
    
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}: ${project.title}`);
      console.log(`  Likes: ${project.likeCount || 0} (array length: ${project.likes?.length || 0})`);
      console.log(`  Comments: ${project.comments?.length || 0}`);
      if (project.comments?.length > 0) {
        console.log(`  Latest comment: ${project.comments[0].text}`);
      }
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkCurrentState();
