import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Project from '@/models/Project'
import { projects as staticProjects, collectionCategories } from '@/lib/data/projects'

type SearchType = 'all' | 'users' | 'projects' | 'collections'

interface SearchOptions {
  q: string
  type?: SearchType
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'recent' | 'popular'
}

interface SearchResult<T> {
  results: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

async function searchUsers(query: string, options: { limit: number; skip: number }) {
  try {
    const searchTerm = query.trim();
    if (!searchTerm) return { results: [], total: 0 };
    
    console.log('Searching users with term:', searchTerm);
    
    // Create a case-insensitive regex pattern that matches any part of the search term
    // Split search term into words and search for each word separately
    const searchTerms = searchTerm.split(/\s+/).filter(Boolean);
    const regexPattern = searchTerms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|');
    
    const regex = new RegExp(regexPattern, 'i');
    
    // Create search conditions for each field
    const searchConditions = [
      { fullName: { $regex: regex } },
      { email: { $regex: regex } },
      { 'profile.enrollmentNo': { $regex: regex } },
      { 'profile.course': { $regex: regex } },
      { 'profile.branch': { $regex: regex } },
      { 'profile.skills': { $in: [regex] } },
      { 'profile.expertise': { $in: [regex] } },
      { 'profile.researchAreas': { $in: [regex] } }
    ];
    
    // If search term has multiple words, also search for exact phrase
    if (searchTerms.length > 1) {
      const exactPhrase = searchTerms.join(' ');
      searchConditions.push(
        { fullName: { $regex: new RegExp(exactPhrase, 'i') } },
        { email: { $regex: new RegExp(exactPhrase, 'i') } }
      );
    }
    
    const userQuery = { $or: searchConditions };
    
    console.log('User query:', JSON.stringify({
      $or: userQuery.$or.map(cond => {
        const key = Object.keys(cond)[0] as keyof typeof cond;
        const value = cond[key];
        if (value && typeof value === 'object' && '$regex' in value) {
          return { [key]: { $regex: value.$regex.toString() } };
        } else if (value && typeof value === 'object' && '$in' in value) {
          return { [key]: { $in: value.$in.map((r: any) => r.toString()) } };
        }
        return { [key]: value };
      })
    }, null, 2));
    
    const [users, total] = await Promise.all([
      (User as any)
        .find(userQuery)
        .select('-password')
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      (User as any).countDocuments(userQuery)
    ]);
    
    console.log(`Found ${users.length} users matching search`);
    
    // Log first user for debugging
    if (users.length > 0) {
      console.log('Sample user found:', {
        id: users[0]._id,
        name: users[0].fullName,
        email: users[0].email
      });
    }
    
    return { results: users, total };
    
  } catch (error) {
    console.error('Error in user search:', error);
    return { results: [], total: 0 };
  }
}

async function searchProjects(query: string, options: { limit: number; skip: number }) {
  try {
    const searchTerm = query.trim();
    
    console.log('Searching projects with term:', searchTerm);
    
    // Create a case-insensitive regex pattern that matches any part of the search term
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    const projectQuery = {
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { tags: { $in: [regex] } },
        { 'author.name': { $regex: regex } },
        { githubUrl: { $regex: regex } },
        { liveUrl: { $regex: regex } }
      ]
    };
    
    console.log('Project query:', JSON.stringify({
      $or: projectQuery.$or.map(cond => {
        const key = Object.keys(cond)[0] as keyof typeof cond;
        const value = cond[key];
        if (value && typeof value === 'object' && '$regex' in value) {
          return { [key]: { $regex: value.$regex.toString() } };
        } else if (value && typeof value === 'object' && '$in' in value) {
          return { [key]: { $in: value.$in.map((r: any) => r.toString()) } };
        }
        return { [key]: value };
      })
    }, null, 2));
    
    const [projects, total] = await Promise.all([
      (Project as any)
        .find(projectQuery)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      (Project as any).countDocuments(projectQuery)
    ]);
    
    console.log(`Found ${projects.length} projects matching search`);
    return { results: projects, total };
    
  } catch (error) {
    console.error('Error in project search:', error);
    return { results: [], total: 0 };
  }

}

function searchStaticProjects(query: string) {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  
  return (staticProjects || []).filter((p: any) => {
    try {
      if (regex.test(String(p.title || ''))) return true
      if (regex.test(String(p.description || ''))) return true
      if ((p.tags || []).some((t: string) => regex.test(t))) return true
      if (p.author && (regex.test(String(p.author.name || '')) || regex.test(String(p.author.username || '')))) return true
      if (p.githubUrl && regex.test(String(p.githubUrl))) return true
      if (p.liveUrl && regex.test(String(p.liveUrl))) return true
    } catch (e) {
      return false
    }
    return false
  })
}

function searchCollections(query: string) {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  
  return (collectionCategories || []).filter((c: any) => {
    try {
      if (regex.test(String(c.name || ''))) return true
      if (regex.test(String(c.slug || ''))) return true
    } catch (e) {
      return false
    }
    return false
  })
}

export async function GET(request: Request) {
  console.log('\n--- New Search Request ---');
  console.log('Request URL:', request.url);
  
  try {
    // Connect to database
    try {
      await connectDB();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          message: dbError instanceof Error ? dbError.message : 'Could not connect to database',
          stack: process.env.NODE_ENV === 'development' ? (dbError as Error).stack : undefined
        },
        { status: 500 }
      );
    }
    
    const url = new URL(request.url);
    
    // Parse and validate search options
    const options: SearchOptions = {
      q: (url.searchParams.get('q') || '').trim(),
      type: (['all', 'users', 'projects', 'collections'].includes(url.searchParams.get('type') || '')
        ? url.searchParams.get('type')
        : 'all') as SearchType,
      page: Math.max(1, parseInt(url.searchParams.get('page') || '1')),
      limit: Math.min(20, Math.max(5, parseInt(url.searchParams.get('limit') || '10'))),
      sortBy: (['relevance', 'recent', 'popular'].includes(url.searchParams.get('sortBy') || '')
        ? url.searchParams.get('sortBy')
        : 'relevance') as 'relevance' | 'recent' | 'popular'
    };
    
    console.log('Search options:', JSON.stringify(options, null, 2));

    if (!options.q) {
      return NextResponse.json({ 
        users: { results: [], total: 0, page: 1, totalPages: 0, hasMore: false },
        projects: { results: [], total: 0, page: 1, totalPages: 0, hasMore: false },
        collections: { results: [], total: 0, page: 1, totalPages: 0, hasMore: false }
      })
    }

    const skip = ((options.page || 1) - 1) * (options.limit || 10)
    const results: Record<string, SearchResult<any>> = {}

    try {
      // Execute search functions sequentially to ensure proper assignment
      if (options.type === 'all' || options.type === 'users') {
        try {
          const userResult = await searchUsers(options.q, { limit: options.limit || 10, skip })
          results.users = {
            results: userResult.results || [],
            total: userResult.total || 0,
            page: options.page,
            totalPages: Math.ceil((userResult.total || 0) / (options.limit || 10)) || 1,
            hasMore: skip + (userResult.results?.length || 0) < (userResult.total || 0)
          }
          console.log('Users found:', userResult.results.length);
        } catch (error) {
          console.error('Error searching users:', error)
          results.users = { results: [], total: 0, page: 1, totalPages: 0, hasMore: false }
        }
      } else {
        results.users = { results: [], total: 0, page: 1, totalPages: 0, hasMore: false }
      }

      // Search projects if needed
      if (options.type === 'all' || options.type === 'projects') {
        try {
          const projectResult = await searchProjects(options.q, { limit: options.limit || 10, skip })
          let combinedResults = [...(projectResult.results || [])]
          let total = projectResult.total || 0
          
          if ((options.page || 1) === 1) {
            const staticResults = searchStaticProjects(options.q)
            combinedResults = [...(staticResults || []), ...combinedResults].slice(0, options.limit || 10)
            total += (staticResults || []).length
          }

          results.projects = {
            results: combinedResults,
            total,
            page: options.page || 1,
            totalPages: Math.ceil(total / (options.limit || 10)),
            hasMore: skip + combinedResults.length < total
          }
        } catch (error) {
          console.error('Error searching projects:', error)
          results.projects = { results: [], total: 0, page: 1, totalPages: 0, hasMore: false }
        }
      } else {
        results.projects = { results: [], total: 0, page: 1, totalPages: 0, hasMore: false }
      }

      // Search collections if needed
      try {
        if (options.type === 'all' || options.type === 'collections') {
          const collections = searchCollections(options.q) || [];
          results.collections = {
            results: collections.slice(skip, skip + (options.limit || 10)),
            total: collections.length,
            page: options.page || 1,
            totalPages: Math.ceil(collections.length / (options.limit || 10)),
            hasMore: skip + (options.limit || 10) < collections.length
          }
        } else {
          results.collections = { results: [], total: 0, page: 1, totalPages: 0, hasMore: false }
        }
      } catch (error) {
        console.error('Error processing collections:', error);
        results.collections = { results: [], total: 0, page: 1, totalPages: 0, hasMore: false };
      }
    } catch (error) {
      console.error('Error in search execution:', error)
    }

    // Ensure all result objects exist and return in the format expected by the frontend
    const finalResults = {
      users: (results.users?.results || []),
      projects: (results.projects?.results || []),
      collections: (results.collections?.results || [])
    };

    console.log('Returning search results:', {
      users: { count: finalResults.users.length },
      projects: { count: finalResults.projects.length },
      collections: { count: finalResults.collections.length }
    });

    return NextResponse.json(finalResults)
  } catch (err) {
    console.error('Search API error:', err)
    return NextResponse.json(
      {
        users: [],
        projects: [],
        collections: [],
        error: 'Failed to perform search',
        message: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
