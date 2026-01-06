import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Test MongoDB connection
    await connectDB();
    
    // Test if models are registered
    const projectModel = mongoose.models.Project || mongoose.model('Project', {} as any);
    const userModel = mongoose.models.User || mongoose.model('User', {} as any);
    
    // Get database stats
    const db = mongoose.connection.db;
    const stats = await db.command({ dbStats: 1 });
    
    // Get collections
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({
      success: true,
      db: {
        name: db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState,
        collections: collections.map(c => c.name),
        stats
      },
      models: {
        Project: projectModel ? 'Registered' : 'Not registered',
        User: userModel ? 'Registered' : 'Not registered'
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI ? 
          process.env.MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://***:***@') : 
          'Not set'
      }
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      connection: {
        readyState: mongoose.connection?.readyState,
        host: mongoose.connection?.host,
        port: mongoose.connection?.port,
        database: mongoose.connection?.name
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI ? 
          process.env.MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://***:***@') : 
          'Not set'
      }
    }, { status: 500 });
  }
}
