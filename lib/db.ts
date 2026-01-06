// lib/db.ts
import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Extend NodeJS global type to include mongoose cache
declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}

// MongoDB connection options
const options: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority'
  // Removed useNewUrlParser and useUnifiedTopology as they're not supported in newer MongoDB drivers
};

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof import('mongoose')> {
  if (cached.conn) {
    console.log('📊 Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    try {
      console.log('🔌 Connecting to MongoDB...');
      cached.promise = mongoose.connect(MONGODB_URI, options).then(mongoose => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      }).catch(err => {
        console.error('❌ MongoDB connection error:', err);
        throw err;
      });
    } catch (error) {
      console.error('❌ Failed to initialize MongoDB connection:', error);
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('❌ Failed to connect to MongoDB:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('ℹ️  Mongoose disconnected');
});

// Handle process termination
const gracefulShutdown = async (msg: string, exitCode: number = 0) => {
  try {
    await mongoose.connection.close();
    console.log(`Mongoose connection closed through ${msg}`);
    process.exit(exitCode);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
};

// Handle app termination
process.on('SIGINT', () => gracefulShutdown('app termination'));
process.on('SIGTERM', () => gracefulShutdown('app termination'));

// Export the mongoose instance and connection
export const db = mongoose.connection;
export default mongoose;