import { NextResponse } from 'next/server';

// Test route to verify basic routing works
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== TEST ROUTE HIT ===');
  
  try {
    const { id } = await params;
    console.log('Test route - ID:', id);
    
    return NextResponse.json({
      success: true,
      message: `Test route working for ID: ${id}`,
      id: id,
      type: typeof id
    });
  } catch (error) {
    console.error('Test route error:', error);
    return NextResponse.json(
      { success: false, error: 'Test route failed' },
      { status: 500 }
    );
  }
}
