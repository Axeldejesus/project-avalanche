import HomePage from './page-client';


async function getData() {
  try {
    // Réduire le délai de revalidation à 10 secondes pour les tests
    const [recommendedRes, upcomingRes, newReleasesRes, platformsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/recommended-games`, { next: { revalidate: 10 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upcoming-games`, { next: { revalidate: 10 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/new-releases`, { next: { revalidate: 10 } }),
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
