import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import mongoose from 'mongoose';

/**
 * GET /api/users/[id]/projects
 * Get all projects for a specific user
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    // Try multiple query approaches to handle different data types
    let projects = [];
    
    // Query 1: Try string match first
    projects = await Project.find({ 'author.id': userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    // Query 2: If no results, try ObjectId match
    if (projects.length === 0 && mongoose.Types.ObjectId.isValid(userId)) {
      projects = await Project.find({ 'author.id': new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }
    
    // Query 3: Try with _id field (for backward compatibility)
    if (projects.length === 0) {
      projects = await Project.find({ 'author._id': userId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }
    
    // Query 4: Try ObjectId with _id field
    if (projects.length === 0 && mongoose.Types.ObjectId.isValid(userId)) {
      projects = await Project.find({ 'author._id': new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }
    
    return Response.json(projects);
  } catch (error: any) {
    console.error('GET /api/users/[id]/projects error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
