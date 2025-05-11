import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../../utils/igdb';

interface IGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  cover?: { image_id: string };
  screenshots?: Array<{ image_id: string }>;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ name: string }>;
  involved_companies?: Array<{ 
    company: { name: string };
    developer?: boolean;
    publisher?: boolean;
  }>;
  release_dates?: Array<{ date: number; platform: { name: string } }>;
  total_rating?: number;
  total_rating_count?: number;
  similar_games?: Array<{
    id: number;
    name: string;
    cover?: { image_id: string };
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const gameId = params.id;
    
    if (!gameId || isNaN(Number(gameId))) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }
    
    const games = await igdbRequest<IGame>('games', `
      fields name, summary, storyline, cover.image_id, screenshots.image_id, 
      genres.name, platforms.name, 
      involved_companies.company.name, involved_companies.developer, involved_companies.publisher, 
      release_dates.date, release_dates.platform.name, 
      total_rating, total_rating_count,
      similar_games.name, similar_games.cover.image_id;
      where id = ${gameId};
    `);
    
    if (games && games.length > 0) {
      const game = games[0];
      
      const gameDetail = {
        id: game.id,
        name: game.name,
        summary: game.summary || 'No summary available',
        storyline: game.storyline,
        cover: getImageUrl(game.cover?.image_id, 'cover_big'),
        screenshots: game.screenshots?.map(s => getImageUrl(s.image_id, 'screenshot_big')) || [],
        genres: game.genres?.map(g => g.name) || [],
        platforms: game.platforms?.map(p => p.name) || [],
        developers: game.involved_companies
          ?.filter(ic => ic.developer)
          .map(ic => ic.company.name) || [],
        publishers: game.involved_companies
          ?.filter(ic => ic.publisher)
          .map(ic => ic.company.name) || [],
        releaseDates: game.release_dates?.map(rd => ({
          date: rd.date,
          platform: rd.platform.name
        })) || [],
        rating: game.total_rating || 0,
        ratingCount: game.total_rating_count || 0,
        similarGames: game.similar_games?.slice(0, 4).map(sg => ({
          id: sg.id,
          name: sg.name,
          cover: getImageUrl(sg.cover?.image_id)
        })) || []
      };
      
      return NextResponse.json(gameDetail);
    } else {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching game details:', error);
    return NextResponse.json({ error: 'Failed to fetch game details' }, { status: 500 });
  }
}
