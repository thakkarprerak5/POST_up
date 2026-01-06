// Check all projects for likes in database
const { MongoClient } = require('mongodb');

async function checkAllProjectLikes() {
  console.log('🔍 Checking All Project Likes in Database...\n');
  
  try {
    const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('post-up');
    const projectsCollection = db.collection('projects');
    
    const projects = await projectsCollection.find({}).toArray();
    console.log(`Found ${projects.length} projects:\n`);
    
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`);
      console.log(`  Title: ${project.title}`);
      console.log(`  Like Count: ${project.likeCount || 0}`);
      console.log(`  Likes Array: [${(project.likes || []).join(', ')}]`);
      console.log(`  Likes Length: ${(project.likes || []).length}`);
      console.log('');
    });
    
    // Count projects with likes
    const projectsWithLikes = projects.filter(p => (p.likes || []).length > 0);
    console.log(`📊 Summary:`);
    console.log(`  Total Projects: ${projects.length}`);
    console.log(`  Projects with Likes: ${projectsWithLikes.length}`);
    console.log(`  Projects without Likes: ${projects.length - projectsWithLikes.length}`);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAllProjectLikes();
