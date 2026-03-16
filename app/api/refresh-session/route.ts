import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Session refresh - please try the auth again',
    timestamp: new Date().toISOString()
  });
}
