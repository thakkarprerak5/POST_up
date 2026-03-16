import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Group from '@/models/Group';

// GET /api/groups - Get all available groups (public endpoint)
export async function GET() {
  try {
    await connectDB();

    console.log('🎯 Public Groups API: Fetching groups');

    // Get all active groups
    const groups = await Group.find({ isActive: true })
      .select('_id name description')
      .sort({ name: 1 })
      .exec();

    console.log(`✅ Public Groups API: Found ${groups.length} groups`);

    return NextResponse.json({
      success: true,
      data: groups.map(group => ({
        id: group._id,
        name: group.name,
        description: group.description
      }))
    });

  } catch (error) {
    console.error('❌ Error in GET /api/groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
