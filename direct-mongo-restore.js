// Direct MongoDB restoration script
const { MongoClient } = require('mongodb');

async function restoreLikeDirectly() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(); // Will use the default database from connection string
    const projectsCollection = db.collection('projects');
    
    // Find the First Project
    const firstProject = await projectsCollection.findOne({ title: 'First Project' });
    
    if (!firstProject) {
      console.log('❌ First Project not found');
      return;
    }
    
    console.log('Found First Project:', firstProject.title);
    console.log('Current likes:', firstProject.likes);
    console.log('Current likeCount:', firstProject.likeCount);
    
    // The original user ID that should be in likes
    const originalUserId = '69327a20497d40e9eb1cd438';
    
    // Check if user is already in likes array
    const hasLiked = firstProject.likes && firstProject.likes.includes(originalUserId);
    
    if (!hasLiked) {
      console.log('🔄 Restoring the original like...');
      
      // Update the document directly
      const result = await projectsCollection.updateOne(
        { _id: firstProject._id },
        { 
          $push: { likes: originalUserId },
          $set: { likeCount: (firstProject.likes?.length || 0) + 1 }
        }
      );
      
      console.log('Update result:', result);
      
      if (result.modifiedCount > 0) {
        console.log('✅ Successfully restored the original like!');
        
        // Verify the update
        const updatedProject = await projectsCollection.findOne({ _id: firstProject._id });
        console.log('New likes count:', updatedProject.likeCount);
        console.log('New likes array:', updatedProject.likes);
        console.log('Comments preserved:', updatedProject.comments?.length || 0);
        console.log('Shares preserved:', updatedProject.shareCount || 0);
      } else {
        console.log('❌ No changes made');
      }
    } else {
      console.log('ℹ️ User already liked this project');
    }
    
    // Also check and fix any other projects with mismatched likeCount
    console.log('\n🔍 Checking all projects for data consistency...');
    const allProjects = await projectsCollection.find({}).toArray();
    
    allProjects.forEach((project) => {
      const actualLikesCount = project.likes ? project.likes.length : 0;
      if (project.likeCount !== actualLikesCount) {
        console.log(`🔧 Fixing ${project.title}: likeCount=${project.likeCount}, actual=${actualLikesCount}`);
        projectsCollection.updateOne(
          { _id: project._id },
          { $set: { likeCount: actualLikesCount } }
        );
      }
    });
    
    console.log('\n✅ Data restoration completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

restoreLikeDirectly();
