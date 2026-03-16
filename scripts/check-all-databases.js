const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function checkAllDatabases() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    // List all databases
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    console.log('📊 Available databases:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name} (size: ${db.sizeOnDisk})`);
    });
    
    // Check each database for projects
    const dbNames = databases.databases.map(db => db.name);
    
    for (const dbName of dbNames) {
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.some(c => c.name === 'projects')) {
          const projects = db.collection('projects');
          const count = await projects.countDocuments();
          const webProjects = await projects.countDocuments({
            tags: { $in: ['web-development'] }
          });
          
          console.log(`\n📂 Database: ${dbName}`);
          console.log(`  - Projects: ${count}`);
          console.log(`  - Web development projects: ${webProjects}`);
          
          if (count > 0) {
            const sample = await projects.findOne({ tags: { $in: ['web-development'] } });
            if (sample) {
              console.log(`  - Sample: ${sample.title} - tags: ${JSON.stringify(sample.tags)}`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error checking ${dbName}: ${error.message}`);
      }
    }
    
    client.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllDatabases();
