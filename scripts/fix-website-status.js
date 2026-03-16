const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');

async function fixWebsiteStatus() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB (post-up database)');
    
    const db = client.db();
    const projects = db.collection('projects');
    
    // Fix the website project status
    await projects.updateOne(
      { title: 'website' },
      { 
        $set: { 
          projectStatus: 'PUBLISHED',
          visibility: 'public'
        }
      }
    );
    
    console.log('✅ Fixed website project status');
    
    // Verify the fix
    const webProjects = await projects.find({
      tags: { $in: ['web-development'] },
      projectStatus: 'PUBLISHED',
      visibility: 'public'
    }).toArray();
    
    console.log(`🌐 Web development projects with PUBLISHED status: ${webProjects.length}`);
    webProjects.forEach(p => {
      console.log(`- ${p.title}: status=${p.projectStatus}`);
    });
    
    client.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixWebsiteStatus();
