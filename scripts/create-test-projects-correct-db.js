const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');

async function createTestProjects() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB (post-up database)');
    
    const db = client.db();
    const projects = db.collection('projects');
    
    // Create test projects for all categories
    const testProjects = [
      {
        title: 'React Dashboard Application',
        description: 'A modern dashboard built with React and TypeScript',
        tags: ['web-development', 'react', 'typescript', 'dashboard'],
        projectStatus: 'PUBLISHED',
        visibility: 'public',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'AI Stock Prediction Model',
        description: 'Machine learning model for predicting stock prices using TensorFlow',
        tags: ['ai-ml', 'python', 'tensorflow', 'machine-learning', 'prediction'],
        projectStatus: 'PUBLISHED',
        visibility: 'public',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Data Visualization Dashboard',
        description: 'Interactive data visualization using Python and Plotly',
        tags: ['data-analysis', 'python', 'pandas', 'visualization', 'dashboard'],
        projectStatus: 'PUBLISHED',
        visibility: 'public',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Flutter Mobile App',
        description: 'Cross-platform mobile application built with Flutter',
        tags: ['mobile-app', 'flutter', 'dart', 'android', 'ios'],
        projectStatus: 'PUBLISHED',
        visibility: 'public',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Cyber Security Scanner',
        description: 'Network vulnerability scanner built with Python',
        tags: ['cyber-security', 'python', 'security', 'vulnerability', 'pentesting'],
        projectStatus: 'PUBLISHED',
        visibility: 'public',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Blockchain Smart Contracts',
        description: 'Decentralized application with Ethereum smart contracts',
        tags: ['blockchain', 'ethereum', 'solidity', 'smart-contracts', 'web3'],
        projectStatus: 'PUBLISHED',
        visibility: 'public',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert test projects
    const result = await projects.insertMany(testProjects);
    console.log(`✅ Created ${result.insertedCount} test projects`);
    
    // Verify
    const totalProjects = await projects.countDocuments();
    console.log(`📊 Total projects in database: ${totalProjects}`);
    
    // Check category counts
    const categories = ['web-development', 'ai-ml', 'data-analysis', 'mobile-app', 'cyber-security', 'blockchain'];
    console.log('\n📊 Category counts:');
    for (const category of categories) {
      const count = await projects.countDocuments({
        tags: { $in: [category] },
        projectStatus: 'PUBLISHED',
        visibility: 'public',
        isDeleted: { $ne: true }
      });
      console.log(`- ${category}: ${count}`);
    }
    
    client.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestProjects();
