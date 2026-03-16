// Migration script to inject category slugs into project tags
// Run this once to fix existing projects

const { MongoClient } = require('mongodb');

// Fixed category slugs - same as in API
const CATEGORIES = [
  { name: "Web Developer", slug: "web-development" },
  { name: "AI / ML", slug: "ai-ml" },
  { name: "Data Analysis", slug: "data-analysis" },
  { name: "Mobile App", slug: "mobile-app" },
  { name: "Cyber Security", slug: "cyber-security" },
  { name: "Blockchain", slug: "blockchain" }
];

// Tag to category mapping for intelligent categorization
const TAG_TO_CATEGORY = {
  // Web Development
  'react': 'web-development',
  'next': 'web-development',
  'nextjs': 'web-development',
  'html': 'web-development',
  'css': 'web-development',
  'javascript': 'web-development',
  'typescript': 'web-development',
  'node': 'web-development',
  'nodejs': 'web-development',
  'express': 'web-development',
  'mongodb': 'web-development',
  'postgresql': 'web-development',
  'mysql': 'web-development',
  'api': 'web-development',
  'frontend': 'web-development',
  'backend': 'web-development',
  'fullstack': 'web-development',
  
  // AI / ML
  'ai': 'ai-ml',
  'ml': 'ai-ml',
  'machine-learning': 'ai-ml',
  'tensorflow': 'ai-ml',
  'pytorch': 'ai-ml',
  'python': 'ai-ml',
  'data-science': 'ai-ml',
  'prediction': 'ai-ml',
  'model': 'ai-ml',
  'neural': 'ai-ml',
  'opencv': 'ai-ml',
  'nlp': 'ai-ml',
  'chatbot': 'ai-ml',
  'gpt': 'ai-ml',
  'llm': 'ai-ml',
  
  // Data Analysis
  'data': 'data-analysis',
  'analysis': 'data-analysis',
  'analytics': 'data-analysis',
  'visualization': 'data-analysis',
  'dashboard': 'data-analysis',
  'statistics': 'data-analysis',
  'pandas': 'data-analysis',
  'numpy': 'data-analysis',
  'sql': 'data-analysis',
  'excel': 'data-analysis',
  'tableau': 'data-analysis',
  
  // Mobile App
  'android': 'mobile-app',
  'ios': 'mobile-app',
  'mobile': 'mobile-app',
  'app': 'mobile-app',
  'flutter': 'mobile-app',
  'react-native': 'mobile-app',
  'swift': 'mobile-app',
  'kotlin': 'mobile-app',
  'java': 'mobile-app',
  'dart': 'mobile-app',
  
  // Cyber Security
  'security': 'cyber-security',
  'cyber': 'cyber-security',
  'pentesting': 'cyber-security',
  'hacking': 'cyber-security',
  'encryption': 'cyber-security',
  'firewall': 'cyber-security',
  'malware': 'cyber-security',
  'vulnerability': 'cyber-security',
  
  // Blockchain
  'blockchain': 'blockchain',
  'web3': 'blockchain',
  'crypto': 'blockchain',
  'bitcoin': 'blockchain',
  'ethereum': 'blockchain',
  'solidity': 'blockchain',
  'smart-contracts': 'blockchain',
  'defi': 'blockchain',
  'nft': 'blockchain'
};

async function migrateProjectTags() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    
    // Get all projects that don't have category slugs in tags
    const allProjects = await projects.find({}).toArray();
    console.log(`📋 Found ${allProjects.length} projects to process`);
    
    let updatedCount = 0;
    
    for (const project of allProjects) {
      const currentTags = project.tags || [];
      const title = project.title || '';
      const description = project.description || '';
      
      // Determine category based on existing tags, title, and description
      let categorySlug = null;
      
      // Check existing tags for category indicators
      for (const tag of currentTags) {
        const normalizedTag = tag.toLowerCase();
        if (TAG_TO_CATEGORY[normalizedTag]) {
          categorySlug = TAG_TO_CATEGORY[normalizedTag];
          break;
        }
      }
      
      // If not found in tags, check title and description
      if (!categorySlug) {
        const text = `${title} ${description}`.toLowerCase();
        for (const [keyword, slug] of Object.entries(TAG_TO_CATEGORY)) {
          if (text.includes(keyword)) {
            categorySlug = slug;
            break;
          }
        }
      }
      
      // Default to web-development if no category found
      if (!categorySlug) {
        categorySlug = 'web-development';
        console.log(`⚠️  No category found for project "${title}", defaulting to web-development`);
      }
      
      // Check if category slug is already in tags
      if (!currentTags.includes(categorySlug)) {
        // Add category slug to tags
        const updatedTags = Array.from(new Set([
          categorySlug.toLowerCase(),
          ...currentTags.map(tag => tag.toLowerCase())
        ]));
        
        // Update the project
        await projects.updateOne(
          { _id: project._id },
          { 
            $set: { 
              tags: updatedTags,
              updatedAt: new Date()
            }
          }
        );
        
        updatedCount++;
        console.log(`✅ Updated project "${title}": ${currentTags} → ${updatedTags}`);
      } else {
        console.log(`✅ Project "${title}" already has category slug: ${categorySlug}`);
      }
    }
    
    console.log(`🎉 Migration complete! Updated ${updatedCount} projects`);
    
    // Verify the migration
    const sampleProjects = await projects.find({}).limit(5).toArray();
    console.log('\n🔍 Sample projects after migration:');
    sampleProjects.forEach(project => {
      console.log(`📝 "${project.title}": tags: [${project.tags?.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
migrateProjectTags();
