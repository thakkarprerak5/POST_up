// Script to restore the original likes and comments data
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post_up');

const Project = require('./models/Project');

async function restoreOriginalData() {
  try {
    console.log('🔄 Restoring original likes and comments data...');
    
    // Find the "First Project" and restore its original like
    const firstProject = await Project.findOne({ title: 'First Project' });
    
    if (firstProject) {
      console.log('Found First Project:', firstProject.title);
      console.log('Current likes:', firstProject.likes);
      console.log('Current likeCount:', firstProject.likeCount);
      
      // Restore the original like from user "69327a20497d40e9eb1cd438"
      const originalUserId = '69327a20497d40e9eb1cd438';
      
      // Check if user is already in likes array
      const userLikedIndex = firstProject.likes.findIndex(id => id.toString() === originalUserId);
      
      if (userLikedIndex === -1) {
        // Add the original like back
        firstProject.likes.push(originalUserId);
        firstProject.likeCount = firstProject.likes.length;
        
        await firstProject.save();
        
        console.log('✅ Restored original like!');
        console.log('New likes:', firstProject.likes);
        console.log('New likeCount:', firstProject.likeCount);
      } else {
        console.log('ℹ️ User already liked this project');
      }
      
      // Verify comments are intact
      console.log('Comments count:', firstProject.comments?.length || 0);
      if (firstProject.comments?.length > 0) {
        console.log('Latest comment:', firstProject.comments[firstProject.comments.length - 1].text);
      }
      
    } else {
      console.log('❌ First Project not found');
    }
    
    // Check all projects to ensure data integrity
    console.log('\n📊 Checking all projects...');
    const allProjects = await Project.find({});
    
    allProjects.forEach((project, index) => {
      console.log(`Project ${index + 1}: ${project.title}`);
      console.log(`  Likes: ${project.likeCount || 0} (array: ${project.likes?.length || 0})`);
      console.log(`  Comments: ${project.comments?.length || 0}`);
      
      // Fix likeCount if it doesn't match likes array length
      if (project.likes && project.likeCount !== project.likes.length) {
        project.likeCount = project.likes.length;
        project.save();
        console.log(`  🔧 Fixed likeCount: ${project.likeCount}`);
      }
    });
    
    console.log('\n✅ Data restoration completed!');
    
  } catch (error) {
    console.error('❌ Error restoring data:', error);
  } finally {
    mongoose.connection.close();
  }
}

restoreOriginalData();
