import HomePage from './page-client';
import { igdbRequest, getImageUrl } from '../utils/igdb';

// Revalidate every 24 hours (86400 seconds)
export const revalidate = 86400;

// Import the types
interface Game {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres?: string;
}

interface NewReleaseGame {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  rating: number;
}

interface UpcomingGame {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  genres?: string;
}

interface Platform {
  id: number;
  name: string;
  icon: string;
}

async function getData() {
  try {
    // Fetch data directly using igdbRequest instead of HTTP calls
    const [recommendedGames, upcomingGames, newReleaseGames, platforms] = await Promise.all([
      getRecommendedGames(),
      getUpcomingGames(),
      getNewReleases(),
      getPlatforms()
    ]);

    return {
      recommendedGames,
      upcomingGames,
      newReleaseGames,
      platforms
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      recommendedGames: [],
      upcomingGames: [],
      newReleaseGames: [],
      platforms: []
    };
  }
}

// Helper functions that replicate the API logic
async function getRecommendedGames(): Promise<Game[]> {
  try {
    const games = await igdbRequest<any>('games', `
      fields name, cover.image_id, genres.name, total_rating;
      where total_rating > 75 & cover.image_id != null;
      sort total_rating desc;
      limit 4;
    `);
    
    if (games && games.length > 0) {
      return games.map((game: any) => ({
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id),
        rating: (game.total_rating ? game.total_rating / 20 : 4.0),
        genres: game.genres?.map((g: any) => g.name).join(', ') || 'Unknown'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching recommended games:', error);
    return [];
  }
}

async function getUpcomingGames(): Promise<UpcomingGame[]> {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const games = await igdbRequest<any>('games', `
      fields name, cover.image_id, first_release_date, genres.name, release_dates.date;
      where 
        first_release_date > ${currentTimestamp} & 
        first_release_date != null & 
        cover.image_id != null & 
        version_parent = null;
      sort first_release_date asc;
      limit 5;
    `);
    
    if (games && games.length > 0) {
      return games.map((game: any) => ({
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id),
        release_date: game.first_release_date || (currentTimestamp + (30 * 86400)),
        genres: game.genres?.map((g: any) => g.name).join(', ') || 'Game'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return [];
  }
}

async function getNewReleases(): Promise<NewReleaseGame[]> {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const sixtyDaysAgo = currentTimestamp - (60 * 86400);
    
    const games = await igdbRequest<any>('games', `
      fields name, cover.image_id, first_release_date, total_rating;
      where first_release_date > ${sixtyDaysAgo} & first_release_date < ${currentTimestamp} & cover.image_id != null;
      sort first_release_date desc;
      limit 3;
    `);
    
    if (games && games.length > 0) {
      return games.map((game: any) => ({
        id: game.id,
        name: game.name,
        cover: getImageUrl(game.cover?.image_id),
        release_date: game.first_release_date || currentTimestamp,
        rating: (game.total_rating ? game.total_rating / 20 : 4.0)
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching new releases:', error);
    return [];
  }
}

async function getPlatforms(): Promise<Platform[]> {
  try {
    const { PLATFORM_ICONS, getPlatformFallbackIcon } = await import('../utils/platform-helpers');
    
    const platforms = await igdbRequest<any>('platforms', `
      fields name;
      where id = (167, 169, 6, 130, 48, 49, 14, 3, 34, 39);
    `);
    
    if (platforms && platforms.length > 0) {
      return platforms.map((platform: any) => ({
        id: platform.id,
        name: platform.name,
        icon: PLATFORM_ICONS[platform.id] || getPlatformFallbackIcon(platform.name)
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return [];
  }
}

export default async function Home() {
  const { recommendedGames, upcomingGames, newReleaseGames, platforms } = await getData();

  return <HomePage
    recommendedGames={recommendedGames} 
    upcomingGames={upcomingGames} 
    newReleaseGames={newReleaseGames} 
    platforms={platforms} 
  />;
}
