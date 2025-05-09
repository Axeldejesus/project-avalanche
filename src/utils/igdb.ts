import getAuth from './auth';

const CLIENT_ID = process.env.IGDB_CLIENT_ID;

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  
  // Otherwise get a new token using getAuth from auth.js
  try {
    const data = await getAuth();
    
    cachedToken = data.access_token;
    // Set expiry time (subtract 5 minutes for safety)
    tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);
    
    return cachedToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

export async function igdbRequest<T = any>(endpoint: string, query: string): Promise<T[]> {
  try {
    const accessToken = await getAccessToken();
    
    if (!CLIENT_ID) {
      throw new Error('IGDB client ID is not properly configured in environment variables');
    }
    
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain'
      },
      body: query
    });
    
    if (!response.ok) {
      console.error(`IGDB API error: ${response.status} ${response.statusText}`);
      return [] as T[]; // Return empty array instead of throwing error
    }
    
    return await response.json();
  } catch (error) {
    console.error(`IGDB request error for ${endpoint}:`, error);
    return [] as T[]; // Return empty array on error
  }
}

/**
 * Obtient l'URL d'une image depuis l'API IGDB
 * @param image_id ID de l'image
 * @param size Taille de l'image (par défaut cover_big)
 * @returns URL de l'image ou URL de placeholder
 */
export function getImageUrl(image_id?: string, size: string = 'cover_big'): string {
  if (!image_id) {
    return '/placeholder-cover.jpg';
  }
  
  // Base URL pour les images IGDB
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${image_id}.jpg`;
}
