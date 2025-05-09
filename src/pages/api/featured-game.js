import { igdbRequest, getImageUrl } from '../../utils/igdb';

export default async function handler(req, res) {
  try {
    // Query a popular recent game to feature
    const games = await igdbRequest('games', `
      fields name, cover.image_id, summary, total_rating, total_rating_count, screenshots.image_id;
      where total_rating > 80 & release_dates.date > 1609459200; // Games released after 2021-01-01
      sort total_rating desc;
      limit 1;
    `);
    
    if (games && games.length > 0) {
      const game = games[0];
      
      // Get a background image from the screenshots
      let backgroundImage = '/placeholder-background.jpg';
      if (game.screenshots && game.screenshots.length > 0) {
        backgroundImage = getImageUrl(game.screenshots[0].image_id, 'screenshot_huge');
      }
      
      const featuredGame = {
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id),
        background: backgroundImage,
        description: game.summary || 'No description available',
        rating: (game.total_rating / 20) || 4.5, // Convert to 5-star scale with fallback
        reviews: game.total_rating_count || 0
      };
      
      console.log("Featured game from API:", featuredGame);
      res.status(200).json(featuredGame);
    } else {
      // Return a fallback object only if no games are found
      const fallbackGame = {
        id: 123,
        name: 'Stellar Odyssey 2025',
        cover: '/placeholder-cover.jpg',
        background: '/placeholder-background.jpg',
        description: 'An epic space adventure that combines the boundaries of gaming with stunning visuals and an immersive storyline.',
        rating: 4.5,
        reviews: 32
      };
      console.log("Using fallback featured game - no results from API");
      res.status(200).json(fallbackGame);
    }
  } catch (error) {
    console.error('Error fetching featured game:', error);
    const fallbackGame = {
      id: 123,
      name: 'Stellar Odyssey 2025',
      cover: '/placeholder-cover.jpg',
      background: '/placeholder-background.jpg',
      description: 'An epic space adventure that combines the boundaries of gaming with stunning visuals and an immersive storyline.',
      rating: 4.5,
      reviews: 32
    };
    console.log("Using fallback featured game due to error:", error.message);
    res.status(200).json(fallbackGame);
  }
}
