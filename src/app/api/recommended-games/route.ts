import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

// Types
interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  genres?: Array<{ name: string }>;
  total_rating?: number;
}

interface RecommendedGame {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres: string;
}

export async function GET(): Promise<NextResponse<RecommendedGame[]>> {
  try {
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, genres.name, total_rating;
      where total_rating > 75 & cover.image_id != null;
      sort total_rating desc;
      limit 4;
    `);
    
    if (games && games.length > 0) {
      const formattedGames: RecommendedGame[] = games.map(game => {
        return {
          id: game.id,
          name: game.name,
          cover: getImageUrl(game.cover?.image_id),
          rating: (game.total_rating ? game.total_rating / 20 : 4.0), // Convert to 5-star scale with fallback
          genres: game.genres?.map(g => g.name).join(', ') || 'Unknown'
        };
      });
      
      console.log(`Retrieved ${formattedGames.length} recommended games from API`);
      return NextResponse.json(formattedGames);
    } else {
      // Return fallback data only if no games are found
      const fallbackGames: RecommendedGame[] = Array(4).fill(null).map((_, i) => ({
        id: i + 1,
        name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
        cover: '/placeholder-cover.jpg',
        rating: 4.0 + Math.random() * 0.5,
        genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
      }));
      console.log("Using fallback recommended games - no results from API");
      return NextResponse.json(fallbackGames);
    }
  } catch (error) {
    console.error('Error fetching recommended games:', error);
    // Return fallback data on error
    const fallbackGames: RecommendedGame[] = Array(4).fill(null).map((_, i) => ({
      id: i + 1,
      name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
      cover: '/placeholder-cover.jpg',
      rating: 4.0 + Math.random() * 0.5,
      genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
    }));
    console.log("Using fallback recommended games due to error:", error instanceof Error ? error.message : error);
    return NextResponse.json(fallbackGames);
  }
}
