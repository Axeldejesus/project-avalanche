import { igdbRequest, getImageUrl } from '../../utils/igdb';

export default async function handler(req, res) {
  try {
    const games = await igdbRequest('games', `
      fields name, cover.image_id, genres.name, total_rating;
      where total_rating > 75 & cover.image_id != null;
      sort total_rating desc;
      limit 4;
    `);
    
    if (games && games.length > 0) {
      const formattedGames = games.map(game => {
        const formattedGame = {
          id: game.id,
          name: game.name,
          cover: getImageUrl(game.cover?.image_id),
          rating: (game.total_rating / 20) || 4.0, // Convert to 5-star scale with fallback
          genres: game.genres?.map(g => g.name).join(', ') || 'Unknown'
        };
        return formattedGame;
      });
      
      console.log(`Retrieved ${formattedGames.length} recommended games from API`);
      res.status(200).json(formattedGames);
    } else {
      // Return fallback data only if no games are found
      const fallbackGames = Array(4).fill().map((_, i) => ({
        id: i + 1,
        name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
        cover: '/placeholder-cover.jpg',
        rating: 4.0 + Math.random() * 0.5,
        genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
      }));
      console.log("Using fallback recommended games - no results from API");
      res.status(200).json(fallbackGames);
    }
  } catch (error) {
    console.error('Error fetching recommended games:', error);
    // Return fallback data on error
    const fallbackGames = Array(4).fill().map((_, i) => ({
      id: i + 1,
      name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
      cover: '/placeholder-cover.jpg',
      rating: 4.0 + Math.random() * 0.5,
      genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
    }));
    console.log("Using fallback recommended games due to error:", error.message);
    res.status(200).json(fallbackGames);
  }
}
