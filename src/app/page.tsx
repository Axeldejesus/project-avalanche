import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Sidebar from '../components/Sidebar';
import GameCard from '../components/GameCard';
import FeaturedGame from '../components/FeaturedGame';

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

async function getData() {
  try {
    // En App Router, nous pouvons utiliser fetch directement du serveur
    const [featuredRes, recommendedRes, topRatedRes, upcomingRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/featured-game`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/recommended-games`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/top-rated-games`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upcoming-games`, { next: { revalidate: 3600 } })
    ]);

    // Parse responses with fallbacks
    const featuredGame = featuredRes.ok ? await featuredRes.json() : {
      id: 123,
      name: 'Stellar Odyssey 2025',
      cover: '/placeholder-cover.jpg',
      background: '/placeholder-background.jpg', // Toujours défini dans le fallback
      description: 'An epic space adventure that combines the boundaries of gaming with stunning visuals and an immersive storyline.',
      rating: 4.5,
      reviews: 32
    };
    
    // S'assurer que background est toujours défini
    if (!featuredGame.background) {
      featuredGame.background = '/placeholder-background.jpg';
    }
    
    const recommendedGames: Game[] = recommendedRes.ok ? await recommendedRes.json() : Array(4).fill(null).map((_, i) => ({
      id: i + 1,
      name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
      cover: '/placeholder-cover.jpg',
      rating: 4.0 + Math.random(),
      genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
    }));
    
    const topRatedGames: Game[] = topRatedRes.ok ? await topRatedRes.json() : Array(5).fill(null).map((_, i) => ({
      id: 100 + i,
      name: `Top Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      rating: 4.5 + (Math.random() * 0.5)
    }));
    
    const upcomingGames: Game[] = upcomingRes.ok ? await upcomingRes.json() : Array(5).fill(null).map((_, i) => ({
      id: 200 + i,
      name: `Upcoming Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30)
    }));

    return {
      featuredGame,
      recommendedGames,
      topRatedGames,
      upcomingGames
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    // Return fallback data in case of error
    return {
      featuredGame: {
        id: 123,
        name: 'Stellar Odyssey 2025',
        cover: '/placeholder-cover.jpg',
        background: '/placeholder-background.jpg', // Toujours défini dans le fallback
        description: 'An epic space adventure that combines the boundaries of gaming with stunning visuals and an immersive storyline.',
        rating: 4.5,
        reviews: 32
      },
      recommendedGames: Array(4).fill(null).map((_, i) => ({
        id: i + 1,
        name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
        cover: '/placeholder-cover.jpg',
        rating: 4.0 + Math.random(),
        genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
      })),
      topRatedGames: Array(5).fill(null).map((_, i) => ({
        id: 100 + i,
        name: `Top Game ${i+1}`,
        cover: '/placeholder-cover.jpg',
        rating: 4.5 + (Math.random() * 0.5)
      })),
      upcomingGames: Array(5).fill(null).map((_, i) => ({
        id: 200 + i,
        name: `Upcoming Game ${i+1}`,
        cover: '/placeholder-cover.jpg',
        release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30)
      }))
    };
  }
}

export default async function Home() {
  const { featuredGame, recommendedGames, topRatedGames, upcomingGames } = await getData();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="GameCritic" width={150} height={30} />
        </div>
        
        <nav className={styles.nav}>
          <a className={styles.active}>Home</a>
          <a>Trending</a>
          <a>New Releases</a>
          <a>Collections</a>
        </nav>
        
        <div className={styles.search}>
          <input type="text" placeholder="Search games..." />
          <button>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        
        <div className={styles.userMenu}>
          <button className={styles.userButton}>
            <span className={styles.userIcon}>J</span>
          </button>
        </div>
      </header>

      <div className={styles.mainLayout}>
        <Sidebar />
        
        <main className={styles.main}>
          {/* Type assertion pour garantir la compatibilité */}
          <FeaturedGame game={featuredGame as any} />
          
          <section className={styles.gameSection}>
            <div className={styles.sectionHeader}>
              <h2>Recommended For You</h2>
              <a href="#" className={styles.viewAll}>View All <span>→</span></a>
            </div>
            <div className={styles.gameGrid}>
              {recommendedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
          
          <section>
            <div className={styles.sectionHeader}>
              <h2>Discover Games</h2>
            </div>
            
            <div className={styles.discover}>
              <div className={styles.discoverSection}>
                <h3>Top Rated</h3>
                {topRatedGames.slice(0, 5).map((game, index) => (
                  <div key={game.id} className={styles.rankCard}>
                    <div className={styles.rank}>{index + 1}</div>
                    <div className={styles.rankGame}>
                      <img src={game.cover} alt={game.name} />
                      <div>
                        <h4>{game.name}</h4>
                        <div className={styles.rating}>{game.rating.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.discoverSection}>
                <h3>Upcoming Releases</h3>
                {upcomingGames.slice(0, 5).map((game) => (
                  <div key={game.id} className={styles.releaseCard}>
                    <img src={game.cover} alt={game.name} />
                    <div>
                      <h4>{game.name}</h4>
                      <div className={styles.releaseDate}>{new Date(game.release_date! * 1000).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
