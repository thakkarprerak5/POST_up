import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== ABSOLUTE MINIMAL ROUTE HIT ===');
  return NextResponse.json({ message: 'Minimal test working' });
}
