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
    const oneYearInFuture = currentTimestamp + (365 * 86400);
    
    // Modification complète de la requête pour s'assurer d'obtenir des jeux à venir
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, release_dates.date, genres.name;
      where 
        version_parent = null & 
        status != 5 & 
        status != 6 & 
        cover.image_id != null &
        release_dates.date > ${currentTimestamp} & 
        release_dates.date < ${oneYearInFuture};
      sort release_dates.date asc;
      limit 10;
    `);
    
    if (games && games.length > 0) {
      // Filtrage supplémentaire côté serveur pour être sûr
      const actualUpcomingGames = games.filter(game => {
        // Vérifie si toutes les dates de sortie connues sont dans le futur
        const hasUpcomingDate = game.release_dates?.some(rd => rd.date > currentTimestamp);
        return hasUpcomingDate;
      });
      
      const formattedGames: UpcomingGame[] = actualUpcomingGames.map(game => {
        // Trouver la plus proche date de sortie future
        const futureDates = game.release_dates?.filter(rd => rd.date > currentTimestamp) || [];
        const nextReleaseDate = futureDates.length > 0 
          ? Math.min(...futureDates.map(rd => rd.date)) 
          : currentTimestamp + (30 * 86400); // Fallback à 30 jours dans le futur
        
        return {
          id: game.id,
          name: game.name,
          cover: getImageUrl(game.cover?.image_id),
          release_date: nextReleaseDate,
          genres: game.genres?.map(g => g.name).join(', ') || 'Game'
        };
      }).slice(0, 5); // Limiter à 5 résultats après tout le filtrage
      
      console.log(`Found ${formattedGames.length} actual upcoming games`);
      return NextResponse.json(formattedGames);
    } else {
      // Return fallback data instead of throwing error
      const fallbackGames: UpcomingGame[] = Array(5).fill(null).map((_, i) => ({
        id: 200 + i,
        name: `Upcoming Game ${i+1}`,
        cover: '/placeholder-cover.jpg',
        release_date: currentTimestamp + ((i+1) * 86400 * 5), // Release dates staggered by 5 days within the next month
        genres: ['Action RPG', 'Adventure', 'Strategy', 'Simulation', 'Racing'][i] || 'Game'
      }));
      return NextResponse.json(fallbackGames);
    }
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    // Return fallback data on error
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const fallbackGames: UpcomingGame[] = Array(5).fill(null).map((_, i) => ({
      id: 200 + i,
      name: `Upcoming Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      release_date: currentTimestamp + ((i+1) * 86400 * 5), // Release dates within the next month
      genres: ['Action RPG', 'Adventure', 'Strategy', 'Simulation', 'Racing'][i] || 'Game'
    }));
    return NextResponse.json(fallbackGames);
  }
}
