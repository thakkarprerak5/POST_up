const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function checkRealDB() {
  try {
    await client.connect();
    const db = client.db();
    const projects = db.collection('projects');
    
    console.log('Checking actual database contents:');
    
    // Get total count
    const totalCount = await projects.countDocuments();
    console.log(`Total projects: ${totalCount}`);
    
    // Get first few projects
    const sampleProjects = await projects.find({}).limit(5).toArray();
    console.log('\nSample projects:');
    sampleProjects.forEach(p => {
      console.log(`- ${p.title}: tags=${JSON.stringify(p.tags)}, status=${p.projectStatus}, visibility=${p.visibility}`);
    });
    
    // Check for web-development specifically
    const webProjects = await projects.find({
      tags: { $in: ['web-development'] }
    }).toArray();
    console.log(`\nWeb development projects: ${webProjects.length}`);
    webProjects.forEach(p => {
      console.log(`- ${p.title}: tags=${JSON.stringify(p.tags)}`);
    });
    
    // Check for all category slugs
    const categories = ['web-development', 'ai-ml', 'data-analysis', 'mobile-app', 'cyber-security', 'blockchain'];
    console.log('\nCategory counts:');
    for (const category of categories) {
      const count = await projects.countDocuments({
        tags: { $in: [category] }
      });
      console.log(`- ${category}: ${count}`);
    }
    
    client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRealDB();
