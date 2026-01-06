// Check the exact pattern of real vs sample projects by examining all fields
const { MongoClient } = require('mongodb');

async function analyzeProjectPatterns() {
  const uri = 'mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/post-up?retryWrites=true&w=majority';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('post-up');
    const projectsCollection = db.collection('projects');
    
    const allProjects = await projectsCollection.find({}).toArray();
    console.log(`\n📦 Analyzing ${allProjects.length} projects:\n`);
    
    allProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   Author: ${project.author?.name} (${project.author?.id})`);
      console.log(`   GitHub: "${project.githubUrl}"`);
      console.log(`   Live: "${project.liveUrl}"`);
      console.log(`   Images: ${project.images?.length || 0}`);
      if (project.images?.length > 0) {
        console.log(`   Image files: ${project.images.join(', ')}`);
      }
      console.log(`   Created: ${project.createdAt}`);
      console.log(`   Description: "${project.description?.substring(0, 50)}..."`);
      console.log(`   Tags: ${project.tags?.join(', ') || 'none'}`);
      console.log('---');
    });
    
    // Look for patterns that distinguish real from sample projects
    console.log('\n🔍 Pattern Analysis:');
    
    const realProjects = allProjects.filter(p => {
      // Check for real GitHub URLs (not generic)
      const hasRealGithub = p.githubUrl && 
        p.githubUrl !== 'https://github.com' && 
        p.githubUrl !== '#' && 
        p.githubUrl.trim() !== '';
      
      // Check for real live URLs (not generic)
      const hasRealLive = p.liveUrl && 
        p.liveUrl !== 'https://example.com' && 
        p.liveUrl !== '#' && 
        p.liveUrl.trim() !== '';
      
      // Check for real uploaded images (not generic placeholders)
      const hasRealImages = p.images && p.images.length > 0 && 
        !p.images.some(img => img.includes('generic-') || img.includes('placeholder'));
      
      return hasRealGithub || hasRealLive || hasRealImages;
    });
    
    const sampleProjects = allProjects.filter(p => !realProjects.includes(p));
    
    console.log(`Real projects: ${realProjects.length}`);
    realProjects.forEach(p => console.log(`   - ${p.title}`));
    
    console.log(`Sample projects: ${sampleProjects.length}`);
    sampleProjects.forEach(p => console.log(`   - ${p.title}`));
    
    // Show the exact criteria that would work
    console.log('\n💡 Suggested Filtering Criteria:');
    console.log('Hide projects that match ALL of these:');
    console.log('1. GitHub URL is "https://github.com" or "#" or empty');
    console.log('2. Live URL is "https://example.com" or "#" or empty');
    console.log('3. Images contain "generic-" or "placeholder"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

analyzeProjectPatterns();
