// This will handle authentication with the IGDB API

export default async function handler(req, res) {
  try {
    const CLIENT_ID = process.env.IGDB_CLIENT_ID;
    const CLIENT_SECRET = process.env.IGDB_SECRET_KEY;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('IGDB credentials are not properly configured in environment variables');
    }
    
    res.status(200).json({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Failed to provide IGDB API credentials' });
  }
}
