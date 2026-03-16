// Fix existing projects by adding appropriate tags based on their content
const mongoose = require('mongoose');
const Project = require('../models/Project.ts');

// Tag mapping based on common project patterns
const titleToTags = {
  'stock': ['ai', 'ml', 'machine-learning', 'python', 'data', 'analytics', 'prediction'],
  'weather': ['web', 'api', 'javascript', 'react', 'frontend', 'api-integration'],
  'ecommerce': ['web', 'react', 'nodejs', 'mongodb', 'fullstack', 'javascript', 'shopping'],
  'chat': ['web', 'react', 'nodejs', 'socket.io', 'javascript', 'real-time', 'messaging'],
  'task': ['web', 'react', 'javascript', 'productivity', 'frontend', 'management'],
  'portfolio': ['web', 'react', 'javascript', 'frontend', 'css', 'personal'],
  'blog': ['web', 'react', 'nodejs', 'mongodb', 'fullstack', 'cms', 'content'],
  'social': ['web', 'react', 'nodejs', 'mongodb', 'fullstack', 'social-network'],
  'video': ['web', 'javascript', 'html5', 'css', 'media', 'streaming'],
  'music': ['web', 'javascript', 'html5', 'css', 'media', 'audio'],
  'calculator': ['web', 'javascript', 'html', 'css', 'utility', 'math'],
  'todo': ['web', 'react', 'javascript', 'productivity', 'frontend', 'task-management'],
  'game': ['web', 'javascript', 'html5', 'css', 'gaming', 'entertainment'],
  'api': ['web', 'nodejs', 'express', 'backend', 'api', 'rest'],
  'database': ['data', 'sql', 'nosql', 'backend', 'database', 'storage'],
  'security': ['security', 'cyber', 'web', 'backend', 'authentication', 'protection'],
  'blockchain': ['blockchain', 'web3', 'crypto', 'solidity', 'smart-contracts', 'decentralized'],
  'mobile': ['mobile', 'android', 'ios', 'flutter', 'react-native', 'app'],
  'ai': ['ai', 'ml', 'machine-learning', 'python', 'tensorflow', 'pytorch', 'intelligence'],
  'data': ['data', 'analytics', 'python', 'visualization', 'dashboard', 'analysis']
};

function getTagsFromTitle(title) {
  const tags = [];
  const lowerTitle = title.toLowerCase();
  
  // Check for keywords in title
  Object.entries(titleToTags).forEach(([keyword, keywordTags]) => {
    if (lowerTitle.includes(keyword)) {
      tags.push(...keywordTags);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(tags)];
}

async function fixProjectTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    console.log('🔗 Connected to MongoDB');

    // Find all projects with empty tags
    const projectsWithoutTags = await Project.find({ 
      $or: [
        { tags: { $size: 0 } },
        { tags: { $exists: false } },
        { tags: null }
      ]
    });

    console.log(`📋 Found ${projectsWithoutTags.length} projects without tags`);

    for (const project of projectsWithoutTags) {
      const suggestedTags = getTagsFromTitle(project.title);
      
      if (suggestedTags.length > 0) {
        await Project.findByIdAndUpdate(project._id, { 
          tags: suggestedTags 
        });
        
        console.log(`✅ Updated "${project.title}" with tags:`, suggestedTags);
      } else {
        console.log(`⚠️ Could not suggest tags for "${project.title}"`);
      }
    }

    console.log('🎉 Tag fixing completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing tags:', error);
    process.exit(1);
  }
}

fixProjectTags();
