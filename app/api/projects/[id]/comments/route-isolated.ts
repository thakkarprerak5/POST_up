import { NextResponse } from 'next/server';

// Completely isolated route without external dependencies
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== ISOLATED COMMENTS ROUTE HIT ===');
  
  try {
    const { id } = await params;
    console.log('Isolated route - Project ID:', id);
    
    // Return mock data for now to test the route
    return NextResponse.json({
      success: true,
      comments: [
        {
          id: '1',
          text: `Mock comment for project ${id}`,
          userName: 'Test User',
          createdAt: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Isolated route error:', error);
    return NextResponse.json(
      { success: false, error: 'Isolated route failed' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Not implemented' }, { status: 501 });
}
