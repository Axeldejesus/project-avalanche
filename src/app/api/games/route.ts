import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 40;
    const offset = (page - 1) * limit;
    
    const platforms = searchParams.get('platforms');
    const genres = searchParams.get('genres');
    const search = searchParams.get('search');
    const releaseYear = searchParams.get('releaseYear');
    const releaseStatus = searchParams.get('releaseStatus');
    const sort = searchParams.get('sort') || 'default';
    
    let whereConditions = 'where cover.image_id != null & version_parent = null';
    let sortCondition = 'sort rating desc';
    
    if (releaseStatus === 'released') {
      sortCondition = 'sort first_release_date desc';
    }
    
    if (sort === 'rating') {
      sortCondition = 'sort rating desc';
    } else if (sort === 'release_desc') {
      sortCondition = 'sort first_release_date desc';
    } else if (sort === 'release_asc') {
      sortCondition = 'sort first_release_date asc';
    } else if (sort === 'name') {
      sortCondition = 'sort name asc';
    }
    
    if (releaseStatus) {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      if (releaseStatus === 'released') {
        whereConditions += ` & (first_release_date < ${currentTimestamp} | first_release_date = null)`;
      } else if (releaseStatus === 'upcoming') {
        whereConditions += ` & first_release_date > ${currentTimestamp} & first_release_date != null`;
      }
    }
    
    if (platforms) {
      const platformIds = platforms.split(',').map(p => parseInt(p));
      whereConditions += ` & platforms = (${platformIds.join(',')})`;
    }
    
    if (genres) {
      const genreIds = genres.split(',').map(p => parseInt(p));
      const genreConditions = genreIds.map(id => `genres = [${id}]`).join(' | ');
      whereConditions += ` & (${genreConditions})`;
    }
    
    if (search && search.trim() !== '') {
      whereConditions += ` & name ~ *"${search.trim()}"*`;
    }
    
    if (releaseYear) {
      const startTimestamp = Math.floor(new Date(`${releaseYear}-01-01`).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(`${releaseYear}-12-31T23:59:59`).getTime() / 1000);
      whereConditions += ` & first_release_date >= ${startTimestamp} & first_release_date <= ${endTimestamp}`;
    }
    
    const games = await igdbRequest('games', `
      fields name, cover.image_id, first_release_date, rating, genres.name, genres.id;
      ${whereConditions};
      ${sortCondition};
      limit ${limit};
      offset ${offset};
    `);
    
    if (!games) {
      return NextResponse.json({ games: [] });
    }
    
    let formattedGames = games.map((game: any) => ({
      id: game.id,
      name: game.name,
      cover: getImageUrl(game.cover?.image_id),
      rating: game.rating ? Math.round(game.rating) / 20 : 0,
      genres: game.genres ? game.genres.map((g: any) => g.name).join(', ') : ''
    }));
    
    if (releaseYear) {
      const year = parseInt(releaseYear);
      formattedGames = formattedGames.filter((game: any) => {
        const originalGame = games.find((g: any) => g.id === game.id);
        if (!originalGame?.first_release_date) return false;
        const gameYear = new Date(originalGame.first_release_date * 1000).getFullYear();
        return gameYear === year;
      });
    }
    
    return NextResponse.json({ games: formattedGames });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
