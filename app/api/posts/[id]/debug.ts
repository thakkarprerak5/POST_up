import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== LIKE ENDPOINT CALLED ===');
  console.log('Post ID:', params.id);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Like endpoint is working',
      postId: params.id,
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in like endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
