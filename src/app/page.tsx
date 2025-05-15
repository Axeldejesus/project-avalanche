import HomePage from './page-client';

// Types
interface Game {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres?: string;
  release_date?: number;
  background?: string;
  description?: string;
  reviews?: number;
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
  rating?: number;
}

interface Platform {
  id: number;
  name: string;
  icon: string;
}

// Message d'erreur simple pour les sections
const ErrorMessage = ({ message }: { message: string }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#b3b3b3' }}>
    <p>{message}</p>
  </div>
);

async function getData() {
  try {
    // Réduire le délai de revalidation à 10 secondes pour les tests
    const [recommendedRes, upcomingRes, newReleasesRes, platformsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/recommended-games`, { next: { revalidate: 10 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upcoming-games`, ),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/new-releases`, ),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/platforms`, { next: { revalidate: 10 } })
    ]);

    // Parse responses with minimal fallbacks
    const recommendedGames = recommendedRes.ok ? await recommendedRes.json() : [];
    const upcomingGames = upcomingRes.ok ? await upcomingRes.json() : [];
    const newReleaseGames = newReleasesRes.ok ? await newReleasesRes.json() : [];
    const platforms = platformsRes.ok ? await platformsRes.json() : [];

    return {
      recommendedGames,
      upcomingGames,
      newReleaseGames,
      platforms
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    // Return empty data in case of error
    return {
      featuredGame: null,
      recommendedGames: [],
      topRatedGames: [],
      upcomingGames: [],
      newReleaseGames: [],
      platforms: []
    };
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
