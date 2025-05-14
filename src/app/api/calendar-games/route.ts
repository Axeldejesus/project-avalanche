import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  first_release_date: number;
  platforms?: Array<{ id: number }>;
}

interface Game {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  platforms: number[];
}

interface CalendarGames {
  [month: string]: Game[];
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year') || '2025';
    const platformsParam = searchParams.get('platforms');
    
    const year = parseInt(yearParam);
    const platforms = platformsParam ? platformsParam.split(',').map(Number) : [];
    
    // Calculate timestamps for the start and end of the year
    const startOfYear = Math.floor(new Date(year, 0, 1, 0, 0, 0).getTime() / 1000);
    const endOfYear = Math.floor(new Date(year, 11, 31, 23, 59, 59).getTime() / 1000);
    
    // Build the platform filter if needed
    let platformFilter = '';
    if (platforms.length > 0) {
      platformFilter = ` & platforms = (${platforms.join(',')})`;
    }
    
    // Pagination IGDB : fetch tous les jeux de l'année par batchs de 500
    let allGames: IGame[] = [];
    let offset = 0;
    const limit = 500;
    let keepFetching = true;

    while (keepFetching) {
      const batch = await igdbRequest<IGame>('games', `
        fields name, cover.image_id, first_release_date, platforms.id;
        where first_release_date >= ${startOfYear} & first_release_date <= ${endOfYear} 
        & cover.image_id != null${platformFilter};
        sort first_release_date asc;
        limit ${limit};
        offset ${offset};
      `);

      if (batch && batch.length > 0) {
        allGames = allGames.concat(batch);
        if (batch.length < limit) {
          keepFetching = false;
        } else {
          offset += limit;
        }
      } else {
        keepFetching = false;
      }
    }
    
    // Organize games by month
    const calendarGames: CalendarGames = {};
    months.forEach(month => {
      calendarGames[month] = [];
    });
    
    if (allGames.length > 0) {
      allGames.forEach(game => {
        if (!game.first_release_date) return;
        const releaseDate = new Date(game.first_release_date * 1000);
        const monthIdx = releaseDate.getMonth();
        const monthName = months[monthIdx];
        if (!monthName) return;
        calendarGames[monthName].push({
          id: game.id,
          name: game.name,
          cover: getImageUrl(game.cover?.image_id, 'cover_small'),
          release_date: game.first_release_date,
          platforms: game.platforms?.map(p => p.id) || []
        });
      });
    }
    
    return NextResponse.json(calendarGames);
  } catch (error) {
    console.error('Error fetching calendar games:', error);
    // Ne jamais retourner de jeux fictifs ici
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
