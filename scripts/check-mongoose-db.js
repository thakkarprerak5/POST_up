const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');

async function checkMongooseDB() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB (post-up database)');
    
    const db = client.db();
    const projects = db.collection('projects');
    
    // Get total count
    const totalCount = await projects.countDocuments();
    console.log(`📊 Total projects: ${totalCount}`);
    
    // Get sample projects
    const sampleProjects = await projects.find({}).limit(5).toArray();
    console.log('\n📝 Sample projects:');
    sampleProjects.forEach(p => {
      console.log(`- ${p.title}: tags=${JSON.stringify(p.tags)}, status=${p.projectStatus}`);
    });
    
    // Check for web-development projects
    const webProjects = await projects.find({
      tags: { $in: ['web-development'] }
    }).toArray();
    console.log(`\n🌐 Web development projects: ${webProjects.length}`);
    webProjects.forEach(p => {
      console.log(`- ${p.title}: tags=${JSON.stringify(p.tags)}`);
    });
    
    // Check all category counts
    const categories = ['web-development', 'ai-ml', 'data-analysis', 'mobile-app', 'cyber-security', 'blockchain'];
    console.log('\n📊 Category counts:');
    for (const category of categories) {
      const count = await projects.countDocuments({
        tags: { $in: [category] }
      });
      console.log(`- ${category}: ${count}`);
    }
    
    client.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMongooseDB();
