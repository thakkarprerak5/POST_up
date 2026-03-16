// API route to proxy PDF files and handle CORS
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('PROPOSAL FILE ROUTE HIT!');
  
  const { pathname } = new URL(request.url);
  
  console.log('Proxy API called with pathname:', pathname);
  
  // Check if this is a request for a PDF file
  if (pathname.includes('/api/proxy/proposal-file/')) {
    // Extract the file path from the URL after /api/proxy/proposal-file/
    let filePath = pathname.replace('/api/proxy/proposal-file/', '');
    
    console.log('Extracted filePath before processing:', filePath);
    
    // If the path starts with 'uploads/', remove it since we'll add 'public/' ourselves
    if (filePath.startsWith('uploads/')) {
      filePath = filePath.replace('uploads/', '');
      console.log('Removed uploads/ prefix, new filePath:', filePath);
    }
    
    // Decode only if the path appears to be encoded (contains %)
    if (filePath.includes('%')) {
      filePath = decodeURIComponent(filePath);
      console.log('Decoded filePath:', filePath);
    }
    
    try {
      // Construct the full file path
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
      
      console.log('Proxy API - final filePath:', filePath);
      console.log('Proxy API - final fullPath:', fullPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.error('File not found:', fullPath);
        console.error('Original filePath:', filePath);
        return NextResponse.json({ error: 'File not found', path: filePath }, { status: 404 });
      }
      
      console.log('File found, reading and serving...');
      
      // Read the file
      const fileBuffer = fs.readFileSync(fullPath);
      
      // Set appropriate headers for PDF response
      const headers = new Headers({
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      });
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: headers,
      });
    } catch (error) {
      console.error('Error serving PDF:', error);
      return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

export async function OPTIONS(request: NextRequest) {
  console.log('OPTIONS ROUTE HIT!');
  // Handle preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
