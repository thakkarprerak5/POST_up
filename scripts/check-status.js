const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function checkStatus() {
  try {
    await client.connect();
    const db = client.db();
    const projects = db.collection('projects');
    
    console.log('Checking project statuses:');
    
    const allProjects = await projects.find({}).toArray();
    console.log('All project statuses:');
    allProjects.forEach(p => {
      console.log(`- ${p.title}: projectStatus=${p.projectStatus}, visibility=${p.visibility}, isDeleted=${p.isDeleted}`);
    });
    
    // Test query without status filter
    const webProjectsNoStatus = await projects.find({
      tags: { $in: ['web-development'] },
      visibility: 'public',
      isDeleted: { $ne: true }
    }).toArray();
    console.log(`\nWeb projects without status filter: ${webProjectsNoStatus.length}`);
    
    // Test query with status filter
    const webProjectsStatus = await projects.find({
      tags: { $in: ['web-development'] },
      visibility: 'public',
      projectStatus: 'PUBLISHED',
      isDeleted: { $ne: true }
    }).toArray();
    console.log(`Web projects with PUBLISHED status: ${webProjectsStatus.length}`);
    
    client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStatus();
