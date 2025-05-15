import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Récupérer les paramètres de filtre
    const platforms = searchParams.get('platforms');
    const genres = searchParams.get('genres');
    const search = searchParams.get('search');
    const releaseYear = searchParams.get('releaseYear');
    
    // Construire les conditions de filtre
    let whereConditions = 'where cover.image_id != null';
    
    if (platforms) {
      const platformIds = platforms.split(',').map(p => parseInt(p));
      whereConditions += ` & platforms = (${platformIds.join(',')})`;
    }
    
    // Nouvelle approche pour le filtre des genres
    if (genres) {
      const genreIds = genres.split(',').map(p => parseInt(p));
      
      // Pour IGDB, la syntaxe "où au moins un des genres est présent" est:
      // where genres = [id1] | genres = [id2] | ...
      const genreConditions = genreIds.map(id => `genres = ${id}`).join(' | ');
      
      if (genreConditions) {
        whereConditions += ` & (${genreConditions})`;
        console.log(`Condition de genres: (${genreConditions})`);
      }
    }
    
    if (search && search.trim() !== '') {
      // Recherche par nom insensible à la casse
      whereConditions += ` & name ~ *"${search.trim()}"*`;
    }
    
    if (releaseYear) {
      // Convertir l'année en timestamps UNIX (1er janvier et 31 décembre de l'année)
      const startTimestamp = Math.floor(new Date(`${releaseYear}-01-01`).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(`${releaseYear}-12-31T23:59:59`).getTime() / 1000);
      whereConditions += ` & first_release_date >= ${startTimestamp} & first_release_date <= ${endTimestamp}`;
    }
    
    console.log(`Requête IGDB complète: ${whereConditions}`);
    
    const games = await igdbRequest('games', `
      fields name, cover.image_id, first_release_date, rating, genres.name, genres.id;
      ${whereConditions};
      sort rating desc;
      limit ${limit};
      offset ${offset};
    `);
    
    // Ajout de logs pour débogage
    console.log(`Nombre de jeux trouvés: ${games?.length || 0}`);
    
    if (!games) {
      return NextResponse.json({ games: [] });
    }
    
    const formattedGames = games.map((game: any) => ({
      id: game.id,
      name: game.name,
      cover: getImageUrl(game.cover?.image_id),
      rating: game.rating ? Math.round(game.rating) / 20 : 0,
      genres: game.genres ? game.genres.map((g: any) => g.name).join(', ') : ''
    }));
    
    return NextResponse.json({ games: formattedGames });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
