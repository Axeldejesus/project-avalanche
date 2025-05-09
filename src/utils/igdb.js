// Utility functions for IGDB API requests

import getAuth from './auth';

const CLIENT_ID = 'imw0sicx44ju01i0gbaq0l1rnnx48u';
const CLIENT_SECRET = '4rtz3lcsibgwomvm4dqv38qmru1fl4';

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  
  // Otherwise get a new token
  try {
    // Get token directly from Twitch API instead of our internal API route
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    cachedToken = data.access_token;
    // Set expiry time (subtract 5 minutes for safety)
    tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);
    
    return cachedToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

export async function igdbRequest(endpoint, query) {
  try {
    const accessToken = await getAccessToken();
    
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
      return []; // Return empty array instead of throwing error
    }
    
    return await response.json();
  } catch (error) {
    console.error(`IGDB request error for ${endpoint}:`, error);
    return []; // Return empty array on error
  }
}

// Helper function to process image URLs
export function getImageUrl(imageId, size = 'cover_big') {
  if (!imageId) return '/placeholder-cover.jpg';
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
