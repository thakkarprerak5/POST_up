// Test script to create sample projects with proper category slugs
// This will verify that the category counting system works

const { MongoClient } = require('mongodb');

const testProjects = [
  {
    title: "React Dashboard Application",
    description: "A modern dashboard built with React and TypeScript",
    tags: ["web-development", "react", "typescript", "dashboard"],
    githubUrl: "https://github.com/example/react-dashboard",
    liveUrl: "https://react-dashboard.example.com",
    projectStatus: "PUBLISHED",
    visibility: "public",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "AI Stock Prediction Model",
    description: "Machine learning model for predicting stock prices using TensorFlow",
    tags: ["ai-ml", "python", "tensorflow", "machine-learning", "prediction"],
    githubUrl: "https://github.com/example/stock-prediction",
    liveUrl: "https://stock-prediction.example.com",
    projectStatus: "PUBLISHED",
    visibility: "public",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Data Visualization Dashboard",
    description: "Interactive data visualization using Python and Plotly",
    tags: ["data-analysis", "python", "pandas", "visualization", "dashboard"],
    githubUrl: "https://github.com/example/data-viz",
    liveUrl: "https://data-viz.example.com",
    projectStatus: "PUBLISHED",
    visibility: "public",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Flutter Mobile App",
    description: "Cross-platform mobile application built with Flutter",
    tags: ["mobile-app", "flutter", "dart", "android", "ios"],
    githubUrl: "https://github.com/example/flutter-app",
    liveUrl: "https://flutter-app.example.com",
    projectStatus: "PUBLISHED",
    visibility: "public",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Cyber Security Scanner",
    description: "Network vulnerability scanner built with Python",
    tags: ["cyber-security", "python", "security", "vulnerability", "pentesting"],
    githubUrl: "https://github.com/example/security-scanner",
    liveUrl: "https://security-scanner.example.com",
    projectStatus: "PUBLISHED",
    visibility: "public",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Blockchain Smart Contracts",
    description: "Decentralized application with Ethereum smart contracts",
    tags: ["blockchain", "ethereum", "solidity", "smart-contracts", "web3"],
    githubUrl: "https://github.com/example/blockchain-dapp",
    liveUrl: "https://blockchain-dapp.example.com",
    projectStatus: "PUBLISHED",
    visibility: "public",
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createTestProjects() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    
    // Clear existing projects
    await projects.deleteMany({});
    console.log('🗑️  Cleared existing projects');
    
    // Insert test projects
    const result = await projects.insertMany(testProjects);
    console.log(`✅ Created ${result.insertedCount} test projects`);
    
    // Verify the projects were created
    const createdProjects = await projects.find({}).toArray();
    console.log('\n🔍 Created projects:');
    createdProjects.forEach(project => {
      console.log(`📝 "${project.title}": tags: [${project.tags.join(', ')}]`);
    });
    
    console.log('\n🎉 Test projects created successfully!');
    console.log('📊 Now test /api/categories endpoint - it should show non-zero counts');
    
  } catch (error) {
    console.error('❌ Failed to create test projects:', error);
  } finally {
    await client.close();
  }
}

// Run the script
createTestProjects();
