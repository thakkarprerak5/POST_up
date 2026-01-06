// Check what types of projects exist and identify sample ones
const BASE_URL = 'http://localhost:3000';

async function checkProjectTypes() {
  console.log('🔍 Analyzing Project Types...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/projects?limit=20`);
    const text = await response.text();
    
    let projects;
    try {
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonPart = text.substring(jsonStart, jsonEnd);
        projects = JSON.parse(jsonPart);
      } else {
        projects = JSON.parse(text);
      }
    } catch (error) {
      console.error('Failed to parse response:', error.message);
      return;
    }
    
    console.log(`Found ${projects.length} projects:\n`);
    
    projects.forEach((project, index) => {
      const projectId = project._id || project.id;
      const isNumericId = /^\d+$/.test(projectId.toString());
      const authorId = project.author?.id;
      const hasRealImages = project.images && project.images.length > 0 && 
                           !project.images.some(img => img.includes('generic-') || img.includes('placeholder'));
      const hasRealLinks = project.githubUrl && project.githubUrl !== 'https://github.com' && project.githubUrl !== '#';
      
      console.log(`${index + 1}. ${project.title}`);
      console.log(`   Project ID: ${projectId} (${isNumericId ? 'NUMERIC' : 'OBJECT'})`);
      console.log(`   Author: ${project.author?.name} (${authorId})`);
      console.log(`   Real Images: ${hasRealImages ? 'Yes' : 'No'}`);
      console.log(`   Real Links: ${hasRealLinks ? 'Yes' : 'No'}`);
      console.log(`   Created: ${project.createdAt}`);
      console.log(`   Description length: ${project.description?.length || 0}`);
      console.log(`   ---`);
    });
    
    // Identify potential sample projects
    const sampleProjects = projects.filter(project => {
      const projectId = project._id || project.id;
      const isNumericId = /^\d+$/.test(projectId.toString());
      const hasRealImages = project.images && project.images.length > 0 && 
                           !project.images.some(img => img.includes('generic-') || img.includes('placeholder'));
      const hasRealLinks = project.githubUrl && project.githubUrl !== 'https://github.com' && project.githubUrl !== '#';
      
      // Consider it a sample if:
      // 1. Has numeric ID, OR
      // 2. Has generic images AND no real links
      return isNumericId || (!hasRealImages && !hasRealLinks);
    });
    
    console.log(`\n🎯 Identified ${sampleProjects.length} potential sample projects:`);
    sampleProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.title} by ${project.author?.name}`);
    });
    
    console.log(`\n✅ Analysis Complete!`);
    console.log(`📋 Recommendation: Hide ${sampleProjects.length} sample projects, show ${projects.length - sampleProjects.length} real projects`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

checkProjectTypes();
