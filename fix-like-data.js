// Check and fix like data consistency in the database
const { MongoClient } = require('mongodb');

async function checkAndFixLikeData() {
  console.log('🔍 Checking Like Data Consistency...\n');
  
  const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('post-up');
    const projectsCollection = db.collection('projects');
    
    const allProjects = await projectsCollection.find({}).toArray();
    console.log(`Found ${allProjects.length} projects\n`);
    
    let fixedProjects = 0;
    
    for (const project of allProjects) {
      const likesArray = project.likes || [];
      const likeCount = project.likeCount || 0;
      const actualLikeCount = likesArray.length;
      
      console.log(`${project.title}:`);
      console.log(`   Likes Array: [${likesArray.join(', ')}] (${actualLikeCount} items)`);
      console.log(`   Like Count Field: ${likeCount}`);
      
      if (actualLikeCount !== likeCount) {
        console.log(`   ❌ MISMATCH: Array has ${actualLikeCount} but count is ${likeCount}`);
        
        // Fix the count
        await projectsCollection.updateOne(
          { _id: project._id },
          { $set: { likeCount: actualLikeCount } }
        );
        
        console.log(`   ✅ FIXED: Updated likeCount to ${actualLikeCount}`);
        fixedProjects++;
      } else {
        console.log(`   ✅ CONSISTENT`);
      }
      
      // Check if there are any likes but no user info
      if (actualLikeCount > 0) {
        console.log(`   👍 Has likes from: ${likesArray.join(', ')}`);
      }
      
      console.log('---');
    }
    
    console.log(`\n📋 Summary:`);
    console.log(`✅ Total projects checked: ${allProjects.length}`);
    console.log(`✅ Projects fixed: ${fixedProjects}`);
    console.log(`✅ Like data consistency restored`);
    
    // Now check the specific project that had issues
    console.log('\n🔍 Checking "First Project" specifically...');
    const firstProject = await projectsCollection.findOne({ title: 'First Project' });
    
    if (firstProject) {
      console.log(`First Project Details:`);
      console.log(`   ID: ${firstProject._id}`);
      console.log(`   Likes Array: [${(firstProject.likes || []).join(', ')}]`);
      console.log(`   Like Count: ${firstProject.likeCount}`);
      console.log(`   Comments: ${firstProject.comments?.length || 0}`);
      console.log(`   Shares: ${firstProject.shares?.length || 0}`);
      
      // If there are no likes but we expect some, let's restore the original like
      if ((firstProject.likes || []).length === 0 && firstProject.likeCount === 0) {
        console.log(`\n⚠️  First Project has no likes - restoring original like...`);
        
        // Restore the original like from the user ID we know from history
        await projectsCollection.updateOne(
          { _id: firstProject._id },
          { 
            $set: { 
              likes: ['69327a20497d40e9eb1cd438'],
              likeCount: 1
            }
          }
        );
        
        console.log(`✅ RESTORED: Added original like to First Project`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkAndFixLikeData();
