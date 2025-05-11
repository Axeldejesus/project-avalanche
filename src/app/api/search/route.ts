import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  total_rating?: number;
  genres?: Array<{ name: string }>;
}

interface SearchResult {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres?: string;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }
  
  try {
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, total_rating, genres.name;
      search "${query}";
      where version_parent = null;
      limit 5;
    `);
    
    if (games && games.length > 0) {
      const results: SearchResult[] = games.map(game => ({
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id),
        rating: (game.total_rating ? game.total_rating / 20 : 4.0),
        genres: game.genres?.map(g => g.name).join(', ') || undefined
      }));
      
      return NextResponse.json(results);
    } else {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error searching games:', error);
    return NextResponse.json([]);
  }
}
