import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    // Get models after connection
    const User = mongoose.models.User || (await import('@/models/User')).default;
    const Project = mongoose.models.Project || (await import('@/models/Project')).default;
    
    // Check if models have the expected methods
    const userCount = await User.estimatedDocumentCount ? 
      await User.estimatedDocumentCount() : 'count method not available';
    const projectCount = await Project.estimatedDocumentCount ? 
      await Project.estimatedDocumentCount() : 'count method not available';
    
    // Test a simple query
    const testUser = await User.findOne({}).lean().catch(() => null);
    const testProject = await Project.findOne({}).lean().catch(() => null);
    
    return NextResponse.json({
      status: 'success',
      database: {
        connected: true,
        connectionState: mongoose.connection.readyState,
        models: Object.keys(mongoose.models),
        userCount,
        projectCount,
        testUser: !!testUser,
        testProject: !!testProject,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI ? '***' : 'Not set',
      },
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          mongoUri: process.env.MONGODB_URI ? '***' : 'Not set',
        },
      },
      { status: 500 }
    );
  }
}
