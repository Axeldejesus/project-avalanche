import { NextResponse } from 'next/server';
import { igdbRequest } from '../../../utils/igdb';

interface Genre {
  id: number;
  name: string;
}

export async function GET() {
  try {
    // Récupérer tous les genres depuis l'API IGDB
    const genres = await igdbRequest<Genre>('genres', `
      fields id, name;
      sort name asc;
      limit 50;
    `);
    
    console.log('Genres récupérés depuis IGDB:', genres);
    
    return NextResponse.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
