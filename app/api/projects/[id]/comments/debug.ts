import { NextResponse } from 'next/server';

// Minimal debug route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== DEBUG ROUTE HIT ===');
  
  try {
    const { id } = await params;
    console.log('Debug route - ID:', id);
    
    return NextResponse.json({
      success: true,
      message: `Debug route working for ID: ${id}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json(
      { success: false, error: 'Debug route failed' },
      { status: 500 }
    );
  }
}
