import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== FRESH TEST ROUTE WORKING ===');
  return NextResponse.json({ message: 'Fresh test route working', timestamp: new Date().toISOString() });
}
