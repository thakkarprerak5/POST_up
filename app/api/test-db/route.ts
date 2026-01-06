import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    // Test MongoDB connection
    const db = mongoose.connection;
    const dbStats = await db.db.stats();
    
    return NextResponse.json({
      success: true,
      dbStatus: {
        connected: mongoose.connection.readyState === 1,
        dbName: db.db.databaseName,
        collections: await db.db.listCollections().toArray()
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        mongoUri: process.env.MONGODB_URI ? 
          process.env.MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://***:***@') : 
          'Not set',
        nodeEnv: process.env.NODE_ENV
      },
      { status: 500 }
    );
  }
}
