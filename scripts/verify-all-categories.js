const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function verifyAllCategories() {
  try {
    await client.connect();
    const db = client.db();
    const projects = db.collection('projects');
    
    console.log('🔍 Verifying all categories after migration:');
    
    const categories = [
      { name: "Web Developer", slug: "web-development" },
      { name: "AI / ML", slug: "ai-ml" },
      { name: "Data Analysis", slug: "data-analysis" },
      { name: "Mobile App", slug: "mobile-app" },
      { name: "Cyber Security", slug: "cyber-security" },
      { name: "Blockchain", slug: "blockchain" }
    ];
    
    for (const category of categories) {
      const categoryProjects = await projects.find({
        isDeleted: { $ne: true },
        visibility: 'public',
        projectStatus: 'PUBLISHED',
        tags: { $in: [category.slug] }
      }).toArray();
      
      console.log(`📊 ${category.name} (${category.slug}): ${categoryProjects.length} projects`);
      categoryProjects.forEach(p => {
        console.log(`  ✅ ${p.title}: tags=[${p.tags?.join(', ')}]`);
      });
    }
    
    // Test the exact query that the API should use
    console.log('\n🎯 Testing exact API query format:');
    const apiResults = [];
    
    for (const category of categories) {
      const count = await projects.countDocuments({
        isDeleted: { $ne: true },
        visibility: 'public',
        projectStatus: 'PUBLISHED',
        tags: { $in: [category.slug] }
      });
      
      apiResults.push({
        name: category.name,
        slug: category.slug,
        count: count
      });
      
      console.log(`📈 API Result: ${category.name} - ${count} projects`);
    }
    
    console.log('\n🎉 Expected API Response:');
    console.log(JSON.stringify(apiResults, null, 2));
    
    client.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyAllCategories();
