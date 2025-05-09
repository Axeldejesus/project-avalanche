import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

// Types
interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  release_dates?: Array<{ date: number }>;
  genres?: Array<{ name: string }>;
}

interface UpcomingGame {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  genres?: string;
}

export async function GET(): Promise<NextResponse<UpcomingGame[]>> {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, release_dates.date, genres.name;
      where release_dates.date > ${currentTimestamp} & release_dates.date != null;
      sort release_dates.date asc;
      limit 5;
    `);
    
    if (games && games.length > 0) {
      const formattedGames: UpcomingGame[] = games.map(game => {
        // Get the earliest release date
        const releaseDates = game.release_dates || [];
        const releaseDate = releaseDates.length > 0 ? 
          Math.min(...releaseDates.map(rd => rd.date)) : 
          currentTimestamp + (30 * 86400); // Fallback to 30 days from now
        
        return {
          id: game.id,
          name: game.name,
          cover: getImageUrl(game.cover?.image_id),
          release_date: releaseDate,
          genres: game.genres?.map(g => g.name).join(', ') || 'Game'
        };
      });
      
      return NextResponse.json(formattedGames);
    } else {
      // Return fallback data instead of throwing error
      const fallbackGames: UpcomingGame[] = Array(5).fill(null).map((_, i) => ({
        id: 200 + i,
        name: `Upcoming Game ${i+1}`,
        cover: '/placeholder-cover.jpg',
        release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30), // Release dates staggered by months
        genres: ['Action RPG', 'Adventure', 'Strategy', 'Simulation', 'Racing'][i] || 'Game'
      }));
      return NextResponse.json(fallbackGames);
    }
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    // Return fallback data on error
    const fallbackGames: UpcomingGame[] = Array(5).fill(null).map((_, i) => ({
      id: 200 + i,
      name: `Upcoming Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30),
      genres: ['Action RPG', 'Adventure', 'Strategy', 'Simulation', 'Racing'][i] || 'Game'
    }));
    return NextResponse.json(fallbackGames);
  }
}
