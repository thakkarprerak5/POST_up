const mongoose = require('mongoose');

async function debugUserProjects() {
  try {
    console.log('🔍 Debugging User Projects Query\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    console.log('✅ Connected to database');
    
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    // Get all projects to see the actual data structure
    const allProjects = await projectsCollection.find({}).toArray();
    console.log(`\n📊 Found ${allProjects.length} projects in database`);
    
    if (allProjects.length > 0) {
      // Show raw data structure of first project
      const firstProject = allProjects[0];
      console.log('\n🔬 Raw project structure:');
      console.log(JSON.stringify(firstProject.author, null, 2));
      
      // Test different query patterns
      const testAuthorId = firstProject.author?.id;
      console.log(`\n🧪 Testing queries for author ID: ${testAuthorId}`);
      
      // Query 1: Exact string match
      const query1 = await projectsCollection.find({ 'author.id': testAuthorId }).toArray();
      console.log(`Query 1 (author.id string): ${query1.length} results`);
      
      // Query 2: ObjectId match
      const query2 = await projectsCollection.find({ 'author.id': mongoose.Types.ObjectId(testAuthorId) }).toArray();
      console.log(`Query 2 (author.id ObjectId): ${query2.length} results`);
      
      // Query 3: Check if it's stored as ObjectId
      const query3 = await projectsCollection.find({ 'author.id': { $type: 'objectId' } }).toArray();
      console.log(`Query 3 (ObjectId type check): ${query3.length} results`);
      
      // Query 4: Check if it's stored as string
      const query4 = await projectsCollection.find({ 'author.id': { $type: 'string' } }).toArray();
      console.log(`Query 4 (string type check): ${query4.length} results`);
      
      // Show all author IDs for comparison
      console.log('\n📋 All author IDs in database:');
      const authorIds = [...new Set(allProjects.map(p => p.author?.id).filter(Boolean))];
      authorIds.forEach((id, index) => {
        const project = allProjects.find(p => p.author?.id === id);
        console.log(`   ${index + 1}. ${id} (${project.title})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugUserProjects();
