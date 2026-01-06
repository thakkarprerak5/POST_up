import { NextResponse } from 'next/server';

// Test route at root level to verify basic API functionality
export async function GET() {
  console.log('=== ROOT TEST ROUTE HIT ===');
  
  return NextResponse.json({
    success: true,
    message: 'Root test route working',
    timestamp: new Date().toISOString()
  });
}
