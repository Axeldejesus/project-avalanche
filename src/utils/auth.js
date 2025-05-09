// Handle authentication with the IGDB API

export default async function getAuth() {
  try {
    const CLIENT_ID = process.env.IGDB_CLIENT_ID;
    const CLIENT_SECRET = process.env.IGDB_SECRET_KEY;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('IGDB credentials are not properly configured in environment variables');
    }
    
    // Get token directly from Twitch API
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}
