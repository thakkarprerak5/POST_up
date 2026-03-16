import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('SIMPLE PROPOSAL ROUTE HIT!');
  
  const { pathname } = new URL(request.url);
  
  console.log('Simple API called with pathname:', pathname);
  
  return NextResponse.json({ message: 'Simple proposal route working' });
}
