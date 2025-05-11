// Handle authentication with the IGDB API

interface AuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Cache pour stocker le token et éviter des appels répétés
let tokenCache: {
  token: AuthResponse | null;
  expiry: number | null;
} = {
  token: null,
  expiry: null
};

export default async function getAuth(): Promise<AuthResponse> {
  try {
    // Vérifier si nous avons un token en cache qui est toujours valide
    const now = Date.now();
    if (tokenCache.token && tokenCache.expiry && now < tokenCache.expiry) {
      console.log('Using cached auth token');
      return tokenCache.token;
    }

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
    
    const token = await response.json();
    
    // Mettre en cache le token avec un temps d'expiration (90% de la durée pour être prudent)
    tokenCache.token = token;
    tokenCache.expiry = now + (token.expires_in * 900); // 90% de la durée en secondes
    
    return token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}
