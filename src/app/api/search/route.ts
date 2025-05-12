import { NextResponse } from 'next/server';
import { igdbRequest, getImageUrl } from '../../../utils/igdb';

interface IGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  total_rating?: number;
  genres?: Array<{ name: string }>;
  first_release_date?: number;
  popularity?: number;
}

interface SearchResult {
  id: number;
  name: string;
  cover: string;
  rating: number; // Add rating field
  genres?: string;
  releaseYear?: number;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }
  
  try {
    // Advanced query with improved relevance
    const games = await igdbRequest<IGame>('games', `
      fields name, cover.image_id, first_release_date, popularity, total_rating, genres.name;
      search "${query}";
      where version_parent = null & (
        name ~ *"${query}"* | 
        alternative_names.name ~ *"${query}"* | 
        involved_companies.company.name ~ *"${query}"*
      );
      limit 10;
      sort popularity desc;
    `);
    
    if (games && games.length > 0) {
      const results: SearchResult[] = games.map(game => {
        const releaseYear = game.first_release_date 
          ? new Date(game.first_release_date * 1000).getFullYear() 
          : undefined;
            
        return {
          id: game.id,
          name: game.name,
          cover: getImageUrl(game.cover?.image_id),
          rating: game.total_rating ? game.total_rating / 20 : 0, // Convert to 5-star scale or default to 0
          genres: game.genres?.map(g => g.name).join(', '),
          releaseYear
        };
      });
      
      // Further sort results to prioritize exact matches in game name
      results.sort((a, b) => {
        // Exact match in name gets highest priority
        const aExactMatch = a.name.toLowerCase() === query.toLowerCase();
        const bExactMatch = b.name.toLowerCase() === query.toLowerCase();
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Starts with match gets next priority
        const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase());
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        return 0;
      });
      
      return NextResponse.json(results);
    } else {
      // Fallback search with more lenient criteria if no results found
      const fallbackGames = await igdbRequest<IGame>('games', `
        fields name, cover.image_id, first_release_date, total_rating, genres.name;
        limit 5;
        where name ~ *"${query}"* & version_parent = null;
      `);
      
      if (fallbackGames && fallbackGames.length > 0) {
        const results: SearchResult[] = fallbackGames.map(game => {
          const releaseYear = game.first_release_date 
            ? new Date(game.first_release_date * 1000).getFullYear() 
            : undefined;
            
          return {
            id: game.id,
            name: game.name,
            cover: getImageUrl(game.cover?.image_id),
            rating: game.total_rating ? game.total_rating / 20 : 0,
            genres: game.genres?.map(g => g.name).join(', '),
            releaseYear
          };
        });
        
        return NextResponse.json(results);
      }
      
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error searching games:', error);
    return NextResponse.json([]);
  }
}
