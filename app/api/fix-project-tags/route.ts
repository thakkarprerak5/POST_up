// API endpoint to fix existing project tags
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

// Import the Project model
let Project: any;
try {
  Project = mongoose.models.Project || require('@/models/Project').default;
} catch (error) {
  console.error('Error importing Project model:', error);
}

// Tag mapping based on common project patterns
const titleToTags: Record<string, string[]> = {
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
  'data': ['data', 'analytics', 'python', 'visualization', 'dashboard', 'analysis'],
  'prediction': ['ai', 'ml', 'machine-learning', 'python', 'data', 'analytics', 'forecasting']
};

function getTagsFromTitle(title: string): string[] {
  const tags: string[] = [];
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

export async function POST() {
  try {
    await connectDB();
    
    console.log('🔗 Connected to MongoDB');

    // Find all projects with empty or missing tags
    const projectsWithoutTags = await Project.find({ 
      $or: [
        { tags: { $size: 0 } },
        { tags: { $exists: false } },
        { tags: null }
      ]
    });

    console.log(`📋 Found ${projectsWithoutTags.length} projects without tags`);

    const results = [];
    
    for (const project of projectsWithoutTags) {
      const suggestedTags = getTagsFromTitle(project.title);
      
      if (suggestedTags.length > 0) {
        await Project.findByIdAndUpdate(project._id, { 
          tags: suggestedTags 
        });
        
        console.log(`✅ Updated "${project.title}" with tags:`, suggestedTags);
        results.push({
          id: project._id,
          title: project.title,
          tags: suggestedTags
        });
      } else {
        console.log(`⚠️ Could not suggest tags for "${project.title}"`);
        results.push({
          id: project._id,
          title: project.title,
          tags: [],
          note: 'No tags suggested'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed tags for ${results.filter(r => r.tags.length > 0).length} projects`,
      results
    });
    
  } catch (error) {
    console.error('❌ Error fixing tags:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
