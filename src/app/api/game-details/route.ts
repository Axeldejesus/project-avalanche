import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    // Récupérer les détails du jeu, y compris genres et plateformes
    const games = await igdbRequest('games', `
      fields name, cover.image_id, genres.name, platforms.name, platforms.id;
      where id = ${gameId};
    `);
    
    if (!games || games.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const game = games[0];

    // Utiliser la première plateforme disponible par défaut
    let selectedPlatform = null;
    let selectedPlatformName = null;
    
    if (game.platforms && game.platforms.length > 0) {
      selectedPlatform = game.platforms[0];
      selectedPlatformName = game.platforms[0].name;
    }
    
    // Formater la réponse
    const formattedGame = {
      id: game.id,
      name: game.name,
      cover: game.cover ? getImageUrl(game.cover.image_id) : null,
      // Récupérer le genre principal (premier de la liste)
      genre: game.genres && game.genres.length > 0 ? game.genres[0].name : 'Unknown',
      // Tous les genres
      genres: game.genres ? game.genres.map((g: any) => g.name) : [],
      // Utiliser la plateforme sélectionnée comme plateforme principale
      platform: selectedPlatformName || 'Unknown',
      // Toutes les plateformes disponibles sous forme de noms
      platforms: game.platforms ? game.platforms.map((p: any) => p.name) : [],
      // Garder également les IDs des plateformes si nécessaire
      platformIds: game.platforms ? game.platforms.map((p: any) => p.id) : []
    };
    
    return NextResponse.json(formattedGame);
  } catch (error) {
    console.error('Error fetching game details:', error);
    return NextResponse.json({ error: 'Failed to fetch game details' }, { status: 500 });
  }
}
