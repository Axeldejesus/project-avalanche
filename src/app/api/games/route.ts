import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  genres?: Array<{ name: string }>;
  total_rating?: number;
}

export async function GET(
  request: Request
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, genres.name, total_rating;
      where cover != null & total_rating != null;
      sort total_rating desc;
      limit ${limit};
      offset ${offset};
    `);
    
    if (games && games.length > 0) {
      const formattedGames = games.map(game => ({
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id, 'cover_big'),
        rating: game.total_rating || 0,
        genres: game.genres?.map(g => g.name).join(', ') || 'Unknown'
      }));
      
      return NextResponse.json({
        games: formattedGames,
        pagination: {
          page,
          limit,
          offset
        }
      });
    } else {
      return NextResponse.json({ 
        games: [],
        pagination: {
          page,
          limit,
          offset
        }
      });
    }
  } catch (error) {
    console.error('Error fetching games list:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
