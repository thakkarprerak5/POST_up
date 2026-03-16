import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🚀 Test proxy route hit!');
  return NextResponse.json({ message: 'Test proxy route working' });
}
