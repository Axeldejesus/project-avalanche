// Handle authentication with the IGDB API

const CLIENT_ID = 'imw0sicx44ju01i0gbaq0l1rnnx48u';
const CLIENT_SECRET = '4rtz3lcsibgwomvm4dqv38qmru1fl4';

export default async function getAuth() {
  try {
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
