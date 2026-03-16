import { NextRequest, NextResponse } from 'next/server';

// Fixed category slugs - Single source of truth
const CATEGORIES = [
  { name: "Web Developer", slug: "web-development" },
  { name: "AI / ML", slug: "ai-ml" },
  { name: "Data Analysis", slug: "data-analysis" },
  { name: "Mobile App", slug: "mobile-app" },
  { name: "Cyber Security", slug: "cyber-security" },
  { name: "Blockchain", slug: "blockchain" }
];

// Categories API - Backend-authoritative category counts
export async function GET(request: NextRequest) {
  try {
    console.log('📊 CATEGORIES API - Computing exact slug-based counts...');
    
    const categoriesWithCounts = [];
    
    // Use direct MongoDB connection that we know works
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017/post-up');
    
    await client.connect();
    const db = client.db();
    const projectsCollection = db.collection('projects');
    
    // Iterate over predefined categories
    for (const category of CATEGORIES) {
      console.log(`🔍 Counting projects for category: ${category.slug}`);
      
      // Use direct MongoDB query that we verified works
      const projects = await projectsCollection.find({
        isDeleted: { $ne: true },
        visibility: 'public',
        projectStatus: 'PUBLISHED',
        tags: { $in: [category.slug] } // Exact slug matching
      }).toArray();
      
      console.log(`📊 Found ${projects.length} projects for ${category.slug}:`);
      projects.forEach((p: any) => {
        console.log(`  - ${p.title}: tags=[${p.tags?.join(', ')}]`);
      });
      
      const count = projects.length;
      
      console.log(`📊 Category from backend:`, {
        name: category.name,
        slug: category.slug,
        count: count
      });
      
      categoriesWithCounts.push({
        name: category.name,
        slug: category.slug,
        count: count
      });
    }
    
    await client.close();
    
    console.log('📊 CATEGORIES API - Final response:', categoriesWithCounts);
    
    return NextResponse.json(categoriesWithCounts);
    
  } catch (error: any) {
    console.error('📊 CATEGORIES API - Error:', error);
    console.error('📊 Error stack:', error.stack);
    return NextResponse.json([], { status: 500 });
  }
}
