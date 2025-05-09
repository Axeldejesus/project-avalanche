import { NextResponse } from 'next/server';

interface AuthResponse {
  clientId: string;
  clientSecret: string;
}

export async function GET(): Promise<NextResponse<AuthResponse | { error: string }>> {
  try {
    const CLIENT_ID = process.env.IGDB_CLIENT_ID;
    const CLIENT_SECRET = process.env.IGDB_SECRET_KEY;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('IGDB credentials are not properly configured in environment variables');
    }
    
    return NextResponse.json({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Failed to provide IGDB API credentials' }, { status: 500 });
  }
}
