// Check database vs API discrepancy
const { MongoClient } = require('mongodb');
const BASE_URL = 'http://localhost:3000';

async function checkDbVsApi() {
  console.log('🔍 Checking Database vs API Discrepancy...\n');
  
  try {
    // Connect to database
    const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('post-up');
    const projectsCollection = db.collection('projects');
    
    // Get first project from database
    const dbProject = await projectsCollection.findOne({ title: 'First Project' });
    console.log('📊 Database Project:');
    console.log(`  Title: ${dbProject.title}`);
    console.log(`  Like Count: ${dbProject.likeCount || 0}`);
    console.log(`  Likes Array: [${(dbProject.likes || []).join(', ')}]`);
    console.log(`  Likes Length: ${(dbProject.likes || []).length}`);
    
    // Get same project from API
    const apiResponse = await fetch(`${BASE_URL}/api/projects`);
    const apiProjects = await apiResponse.json();
    const apiProject = apiProjects.find(p => p.title === 'First Project');
    
    console.log('\n🌐 API Project:');
    console.log(`  Title: ${apiProject.title}`);
    console.log(`  Like Count: ${apiProject.likeCount || 0}`);
    console.log(`  Liked By User: ${apiProject.likedByUser || false}`);
    console.log(`  Likes Array: [${(apiProject.likes || []).join(', ')}]`);
    console.log(`  Likes Length: ${(apiProject.likes || []).length}`);
    
    // Compare
    console.log('\n🔍 Comparison:');
    console.log(`  DB Like Count: ${dbProject.likeCount || 0}`);
    console.log(`  API Like Count: ${apiProject.likeCount || 0}`);
    console.log(`  Counts Match: ${(dbProject.likeCount || 0) === (apiProject.likeCount || 0)}`);
    
    if ((dbProject.likeCount || 0) !== (apiProject.likeCount || 0)) {
      console.log('❌ MISMATCH FOUND! There\'s a bug in the API.');
    } else {
      console.log('✅ Counts match - API is returning correct data');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkDbVsApi();
