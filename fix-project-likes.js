// Script to fix existing projects with missing likes arrays
const mongoose = require('mongoose');

async function fixProjectLikes() {
  try {
    // Connect to MongoDB directly
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Project = require('./models/Project');
    
    console.log('🔍 Finding projects with missing likes arrays...');
    
    // Find projects that don't have likes array or likeCount
    const projectsToFix = await Project.find({
      $or: [
        { likes: { $exists: false } },
        { likes: null },
        { likeCount: { $exists: false } },
        { likeCount: null }
      ]
    });
    
    console.log(`📊 Found ${projectsToFix.length} projects to fix`);
    
    for (const project of projectsToFix) {
      console.log(`🔧 Fixing project: ${project.title} (${project._id})`);
      
      // Initialize likes array if it doesn't exist
      if (!project.likes || !Array.isArray(project.likes)) {
        project.likes = [];
      }
      
      // Initialize likeCount if it doesn't exist
      if (typeof project.likeCount !== 'number') {
        project.likeCount = project.likes.length;
      }
      
      // Mark as modified and save
      project.markModified('likes');
      project.markModified('likeCount');
      
      await project.save();
      console.log(`✅ Fixed project: ${project.title}`);
    }
    
    console.log('🎉 All projects have been fixed!');
    
    // Verify the fix
    const allProjects = await Project.find({});
    console.log(`📊 Total projects in database: ${allProjects.length}`);
    
    let validProjects = 0;
    for (const project of allProjects) {
      if (Array.isArray(project.likes) && typeof project.likeCount === 'number') {
        validProjects++;
      }
    }
    
    console.log(`✅ Projects with valid likes data: ${validProjects}/${allProjects.length}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing projects:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixProjectLikes();
