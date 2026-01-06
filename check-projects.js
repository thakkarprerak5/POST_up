const { connectDB } = require('./lib/db');
const Project = require('./models/Project');

async function checkProjects() {
  try {
    await connectDB();
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects in database`);
    if (projects.length > 0) {
      console.log('First project:', {
        _id: projects[0]._id,
        id: projects[0].id,
        title: projects[0].title,
        likeCount: projects[0].likeCount,
        commentsCount: projects[0].comments?.length || 0
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkProjects();
