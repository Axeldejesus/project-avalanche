import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

// Types
interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  total_rating?: number;
}

interface TopRatedGame {
  id: number;
  name: string;
  cover: string;
  rating: number;
}

export async function GET(): Promise<NextResponse<TopRatedGame[]>> {
  try {
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, total_rating;
      where total_rating > 85;
      sort total_rating desc;
      limit 5;
    `);
    
    if (games && games.length > 0) {
      const formattedGames: TopRatedGame[] = games.map(game => ({
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id),
        rating: (game.total_rating ? game.total_rating / 20 : 4.5) // Convert to 5-star scale with fallback
      }));
      
      return NextResponse.json(formattedGames);
    } else {
      // Return fallback data instead of throwing error
      const fallbackGames: TopRatedGame[] = Array(5).fill(null).map((_, i) => ({
        id: 100 + i,
        name: `Top Game ${i+1}`,
        cover: '/placeholder-cover.jpg',
        rating: 4.5 + (Math.random() * 0.5)
      }));
      return NextResponse.json(fallbackGames);
    }
  } catch (error) {
    console.error('Error fetching top rated games:', error);
    // Return fallback data on error
    const fallbackGames: TopRatedGame[] = Array(5).fill(null).map((_, i) => ({
      id: 100 + i,
      name: `Top Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      rating: 4.5 + (Math.random() * 0.5)
    }));
    return NextResponse.json(fallbackGames);
  }
}
