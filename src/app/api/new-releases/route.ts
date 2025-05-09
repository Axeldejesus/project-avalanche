import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  first_release_date?: number;
  total_rating?: number;
}

interface NewReleaseGame {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  rating: number;
}

export async function GET(): Promise<NextResponse<NewReleaseGame[]>> {
  try {
    // Get games released in the last 60 days
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const sixtyDaysAgo = currentTimestamp - (60 * 86400);
    
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, first_release_date, total_rating;
      where first_release_date > ${sixtyDaysAgo} & first_release_date < ${currentTimestamp} & cover.image_id != null;
      sort first_release_date desc;
      limit 3;
    `);
    
    if (games && games.length > 0) {
      const formattedGames: NewReleaseGame[] = games.map(game => ({
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id),
        release_date: game.first_release_date || currentTimestamp,
        rating: (game.total_rating ? game.total_rating / 20 : 4.0)
      }));
      
      return NextResponse.json(formattedGames);
    } else {
      // Return fallback data if no results
      const fallbackGames: NewReleaseGame[] = [
        {
          id: 301,
          name: "Nova Strike",
          cover: "/nova-strike.jpg",
          release_date: currentTimestamp - (7 * 86400),
          rating: 4.2
        },
        {
          id: 302,
          name: "Dark Echoes",
          cover: "/dark-echoes.jpg",
          release_date: currentTimestamp - (12 * 86400),
          rating: 4.8
        },
        {
          id: 303,
          name: "Pro Soccer 25",
          cover: "/pro-soccer.jpg",
          release_date: currentTimestamp - (17 * 86400),
          rating: 3.9
        }
      ];
      
      return NextResponse.json(fallbackGames);
    }
  } catch (error) {
    console.error('Error fetching new release games:', error);
    
    // Fallback data on error
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const fallbackGames: NewReleaseGame[] = [
      {
        id: 301,
        name: "Nova Strike",
        cover: "/nova-strike.jpg",
        release_date: currentTimestamp - (7 * 86400),
        rating: 4.2
      },
      {
        id: 302,
        name: "Dark Echoes",
        cover: "/dark-echoes.jpg",
        release_date: currentTimestamp - (12 * 86400),
        rating: 4.8
      },
      {
        id: 303,
        name: "Pro Soccer 25",
        cover: "/pro-soccer.jpg",
        release_date: currentTimestamp - (17 * 86400),
        rating: 3.9
      }
    ];
    
    return NextResponse.json(fallbackGames);
  }
}
