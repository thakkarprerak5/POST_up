import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    console.log('🔍 Fetching ganpat profile photo...');
    
    // Use direct database access since User model has issues
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return NextResponse.json({ 
        profilePhoto: '/placeholder-user.jpg',
        error: 'User not found' 
      }, { status: 404 });
    }
    
    console.log('✅ Found ganpat user:', {
      email: ganpatUser.email,
      fullName: ganpatUser.fullName,
      photo: ganpatUser.photo || 'NOT SET',
      type: ganpatUser.type || 'NOT SET'
    });
    
    // Return the profile photo
    const profilePhoto = ganpatUser.photo || '/placeholder-user.jpg';
    
    console.log('🔥 Returning profile photo:', profilePhoto);
    
    return NextResponse.json({
      profilePhoto: profilePhoto,
      user: {
        email: ganpatUser.email,
        name: ganpatUser.fullName,
        type: ganpatUser.type
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching ganpat profile photo:', error);
    return NextResponse.json({ 
      profilePhoto: '/placeholder-user.jpg',
      error: error.message 
    }, { status: 500 });
  }
}
