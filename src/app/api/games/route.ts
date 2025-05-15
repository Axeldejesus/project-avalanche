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
    const releaseStatus = searchParams.get('releaseStatus');
    const sort = searchParams.get('sort') || 'default'; // Nouveau paramètre de tri
    
    console.log(`Paramètres de recherche: page=${page}, platforms=${platforms}, genres=${genres}, search=${search}, releaseYear=${releaseYear}, releaseStatus=${releaseStatus}, sort=${sort}`);
    
    // Construire les conditions de filtre
    let whereConditions = 'where cover.image_id != null';
    
    // Déterminer le type de tri
    let sortCondition = 'sort rating desc';
    
    // Si le statut est "released", changer le tri pour montrer les jeux récents en premier
    if (releaseStatus === 'released') {
      // Utiliser first_release_date desc pour les jeux déjà sortis
      sortCondition = 'sort first_release_date desc';
      console.log('Tri modifié: par date de sortie décroissante (plus récent en premier)');
    }
    
    // Utiliser le tri spécifié si fourni
    if (sort === 'rating') {
      sortCondition = 'sort rating desc';
    } else if (sort === 'release_desc') {
      sortCondition = 'sort first_release_date desc';
    } else if (sort === 'release_asc') {
      sortCondition = 'sort first_release_date asc';
    } else if (sort === 'name') {
      sortCondition = 'sort name asc';
    }
    
    // Amélioration du filtre pour les jeux sortis
    if (releaseStatus) {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      console.log(`Current timestamp: ${currentTimestamp}, date actuelle: ${new Date(currentTimestamp * 1000).toISOString()}`);
      
      if (releaseStatus === 'released') {
        // Games that have already been released - USING IMPROVED APPROACH
        whereConditions += ` & first_release_date < ${currentTimestamp}`;
        console.log(`Filtre pour jeux sortis ajouté: first_release_date < ${currentTimestamp}`);
      } else if (releaseStatus === 'upcoming') {
        // Games that have not been released yet
        whereConditions += ` & first_release_date > ${currentTimestamp} & first_release_date != null`;
        console.log(`Filtre pour jeux à venir ajouté: first_release_date > ${currentTimestamp}`);
      }
    }
    
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
    console.log(`Tri utilisé: ${sortCondition}`);
    
    const games = await igdbRequest('games', `
      fields name, cover.image_id, first_release_date, rating, genres.name, genres.id;
      ${whereConditions};
      ${sortCondition};
      limit ${limit};
      offset ${offset};
    `);
    
    // Amélioration des logs pour débogage
    console.log(`Nombre de jeux trouvés: ${games?.length || 0}`);
    if (games && games.length > 0) {
      // Afficher quelques exemples de jeux pour débogage
      console.log('Exemples de jeux retournés:');
      games.slice(0, 3).forEach((game: any, index: number) => {
        console.log(`Jeu ${index + 1}: ${game.name}, ID: ${game.id}, Date de sortie: ${game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : 'non définie'}`);
      });
    } else {
      console.log('Aucun jeu trouvé avec les filtres actuels');
    }
    
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
