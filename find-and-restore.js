// Direct MongoDB restoration script with database name check
const { MongoClient } = require('mongodb');

async function restoreLikeDirectly() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // List all databases to find the correct one
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    console.log('Available databases:');
    databases.databases.forEach(db => {
      console.log(`  - ${db.name}`);
    });
    
    // Try common database names
    const possibleDbNames = ['post_up', 'POST_up', 'nextauth', 'test'];
    
    for (const dbName of possibleDbNames) {
      const db = client.db(dbName);
      const projectsCollection = db.collection('projects');
      
      try {
        const count = await projectsCollection.countDocuments();
        console.log(`\n📊 Database "${dbName}" has ${count} projects`);
        
        if (count > 0) {
          const firstProject = await projectsCollection.findOne({ title: 'First Project' });
          
          if (firstProject) {
            console.log('✅ Found First Project in database:', dbName);
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
                
                return; // Success, exit the loop
              } else {
                console.log('❌ No changes made');
              }
            } else {
              console.log('ℹ️ User already liked this project');
              return;
            }
          }
        }
      } catch (error) {
        console.log(`Database "${dbName}" not accessible or no projects collection`);
      }
    }
    
    console.log('❌ Could not find First Project in any database');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

restoreLikeDirectly();
