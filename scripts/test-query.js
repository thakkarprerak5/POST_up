const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function testQueries() {
  try {
    await client.connect();
    const db = client.db();
    const projects = db.collection('projects');
    
    console.log('Testing different query approaches:');
    
    // Test 1: Direct tag match
    const webProjects1 = await projects.find({
      tags: 'web-development'
    }).toArray();
    console.log('Direct match web-development:', webProjects1.length);
    
    // Test 2: Using $elemMatch
    const webProjects2 = await projects.find({
      tags: { $elemMatch: { $eq: 'web-development' } }
    }).toArray();
    console.log('elemMatch web-development:', webProjects2.length);
    
    // Test 3: Using $in with proper syntax
    const webProjects3 = await projects.find({
      tags: { $in: ['web-development'] }
    }).toArray();
    console.log('$in web-development:', webProjects3.length);
    
    // Test 4: Check if tags contain the string
    const webProjects4 = await projects.find({
      tags: { $regex: 'web-development' }
    }).toArray();
    console.log('regex web-development:', webProjects4.length);
    
    // Test 5: Manual array check
    const allProjects = await projects.find({}).toArray();
    const manualWebProjects = allProjects.filter(p => 
      p.tags && p.tags.includes('web-development')
    );
    console.log('Manual filter web-development:', manualWebProjects.length);
    
    client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testQueries();
