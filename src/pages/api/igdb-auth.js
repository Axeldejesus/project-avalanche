// This will handle authentication with the IGDB API

export default async function handler(req, res) {
  try {
    const CLIENT_ID = 'imw0sicx44ju01i0gbaq0l1rnnx48u';
    const CLIENT_SECRET = '4rtz3lcsibgwomvm4dqv38qmru1fl4';
    
    res.status(200).json({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Failed to provide IGDB API credentials' });
  }
}
