import { igdbRequest, getImageUrl } from '../../utils/igdb';

export default async function handler(req, res) {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const games = await igdbRequest('games', `
      fields name, cover.image_id, release_dates.date;
      where release_dates.date > ${currentTimestamp} & release_dates.date != null;
      sort release_dates.date asc;
      limit 5;
    `);
    
    if (games && games.length > 0) {
      const formattedGames = games.map(game => {
        // Get the earliest release date
        const releaseDates = game.release_dates || [];
        const releaseDate = releaseDates.length > 0 ? 
          Math.min(...releaseDates.map(rd => rd.date)) : 
          currentTimestamp + (30 * 86400); // Fallback to 30 days from now
        
        return {
          id: game.id,
          name: game.name,
          cover: getImageUrl(game.cover?.image_id),
          release_date: releaseDate
        };
      });
      
      res.status(200).json(formattedGames);
    } else {
      // Return fallback data instead of throwing error
      const fallbackGames = Array(5).fill().map((_, i) => ({
        id: 200 + i,
        name: `Upcoming Game ${i+1}`,
        cover: '/placeholder-cover.jpg',
        release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30) // Release dates staggered by months
      }));
      res.status(200).json(fallbackGames);
    }
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    // Return fallback data on error
    const fallbackGames = Array(5).fill().map((_, i) => ({
      id: 200 + i,
      name: `Upcoming Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30)
    }));
    res.status(200).json(fallbackGames);
  }
}
