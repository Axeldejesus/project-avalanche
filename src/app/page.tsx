import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Sidebar from '../components/Sidebar';
import GameCard from '../components/GameCard';
import FeaturedGame from '../components/FeaturedGame';
import PlatformImage from '../components/PlatformImage';

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
}

interface Platform {
  id: number;
  name: string;
  icon: string;
}

async function getData() {
  try {
    // En App Router, nous pouvons utiliser fetch directement du serveur
    const [featuredRes, recommendedRes, topRatedRes, upcomingRes, newReleasesRes, platformsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/featured-game`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/recommended-games`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/top-rated-games`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upcoming-games`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/new-releases`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/platforms`, { next: { revalidate: 3600 } })
    ]);

    // Parse responses with fallbacks for existing API routes
    const featuredGame = featuredRes.ok ? await featuredRes.json() : {
      id: 123,
      name: 'Stellar Odyssey 2025',
      cover: '/placeholder-cover.jpg',
      background: '/placeholder-background.jpg',
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
      rating: 4.5 + (Math.random() * 0.5),
      genres: ['RPG', 'Adventure', 'Strategy', 'Shooter', 'Puzzle'][i] || 'Game'
    }));
    
    const upcomingGames: UpcomingGame[] = upcomingRes.ok ? await upcomingRes.json() : Array(5).fill(null).map((_, i) => ({
      id: 200 + i,
      name: `Upcoming Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30),
      genres: ['Action RPG', 'Adventure', 'Strategy', 'Simulation', 'Racing'][i] || 'Game'
    }));

    // Parse responses for new API routes
    const newReleaseGames: NewReleaseGame[] = newReleasesRes.ok ? await newReleasesRes.json() : [
      {
        id: 301,
        name: "Nova Strike",
        cover: "/nova-strike.jpg",
        release_date: Math.floor(Date.now()/1000) - (7 * 86400),
        rating: 4.2
      },
      {
        id: 302,
        name: "Dark Echoes",
        cover: "/dark-echoes.jpg",
        release_date: Math.floor(Date.now()/1000) - (12 * 86400),
        rating: 4.8
      },
      {
        id: 303,
        name: "Pro Soccer 25",
        cover: "/pro-soccer.jpg",
        release_date: Math.floor(Date.now()/1000) - (17 * 86400),
        rating: 3.9
      }
    ];

    const platforms: Platform[] = platformsRes.ok ? await platformsRes.json() : [
      { id: 1, name: "PlayStation 5", icon: "https://example.com/playstation.png" },
      { id: 2, name: "Xbox Series X", icon: "https://example.com/xbox.png" },
      { id: 3, name: "PC", icon: "https://example.com/pc.png" },
      { id: 4, name: "Nintendo Switch", icon: "https://example.com/switch.png" }
    ];

    return {
      featuredGame,
      recommendedGames,
      topRatedGames,
      upcomingGames,
      newReleaseGames,
      platforms
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    // Return fallback data in case of error
    return {
      featuredGame: {
        id: 123,
        name: 'Stellar Odyssey 2025',
        cover: '/placeholder-cover.jpg',
        background: '/placeholder-background.jpg',
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
        rating: 4.5 + (Math.random() * 0.5),
        genres: ['RPG', 'Adventure', 'Strategy', 'Shooter', 'Puzzle'][i] || 'Game'
      })),
      upcomingGames: Array(5).fill(null).map((_, i) => ({
        id: 200 + i,
        name: `Upcoming Game ${i+1}`,
        cover: '/placeholder-cover.jpg',
        release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30),
        genres: ['Action RPG', 'Adventure', 'Strategy', 'Simulation', 'Racing'][i] || 'Game'
      })),
      newReleaseGames: [
        {
          id: 301,
          name: "Nova Strike",
          cover: "/nova-strike.jpg",
          release_date: Math.floor(Date.now()/1000) - (7 * 86400),
          rating: 4.2
        },
        {
          id: 302,
          name: "Dark Echoes",
          cover: "/dark-echoes.jpg",
          release_date: Math.floor(Date.now()/1000) - (12 * 86400),
          rating: 4.8
        },
        {
          id: 303,
          name: "Pro Soccer 25",
          cover: "/pro-soccer.jpg",
          release_date: Math.floor(Date.now()/1000) - (17 * 86400),
          rating: 3.9
        }
      ],
      platforms: [
        { id: 1, name: "PlayStation 5", icon: "https://example.com/playstation.png" },
        { id: 2, name: "Xbox Series X", icon: "https://example.com/xbox.png" },
        { id: 3, name: "PC", icon: "https://example.com/pc.png" },
        { id: 4, name: "Nintendo Switch", icon: "https://example.com/switch.png" }
      ]
    };
  }
}

// Helper to format date
function formatReleaseDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Helper to get fallback icon for platforms
function getPlatformFallbackIcon(platformName: string): string {
  switch (platformName) {
    case "PlayStation 5":
      return "/playstation-fallback.png";
    case "Xbox Series X":
      return "/xbox-fallback.png";
    case "PC":
      return "/pc-fallback.png";
    case "Nintendo Switch":
      return "/switch-fallback.png";
    default:
      return "/default-fallback.png";
  }
}

export default async function Home() {
  const { featuredGame, recommendedGames, topRatedGames, upcomingGames, newReleaseGames, platforms } = await getData();

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
          <div className={styles.discoverContainer}>
            
            {/* Editor's Choice avec background color au lieu d'image */}
            <div className={styles.editorChoice} style={{
              backgroundColor: '#2a1a66', 
              backgroundImage: 'linear-gradient(135deg, #2a1a66 0%, #6c5ce7 100%)'
            }}>
              <div className={styles.editorChoiceBadge}>Editor's Choice</div>
              <div className={styles.editorChoiceContent}>
                <h2 className={styles.editorChoiceTitle}>Ancient Chronicles</h2>
                <p className={styles.editorChoiceDescription}>
                  Embark on an epic journey through forgotten lands and uncover the mysteries of a lost civilization.
                </p>
                <div className={styles.editorChoiceRating}>
                  <div className={styles.editorChoiceStars}>
                    {'★'.repeat(4)}{'☆'.repeat(1)}
                  </div>
                  <span className={styles.editorChoiceReviews}>4.7 (3.1k reviews)</span>
                </div>
                <button className={styles.viewDetailsButton}>View Details</button>
              </div>
            </div>

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
            
            <div className={styles.discoverSections}>
              {/* New Releases */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}>🆕</div>
                  New Releases
                </div>
                
                {newReleaseGames.map(game => (
                  <div key={game.id} className={styles.newReleaseCard}>
                    <img src={game.cover} alt={game.name} className={styles.newReleaseImage} />
                    <div className={styles.newReleaseInfo}>
                      <div className={`${styles.newReleaseName} ${styles.titleWithTooltip}`}>
                        {game.name}
                        <div className={styles.imageTooltip}>
                          <img src={game.cover} alt={game.name} className={styles.tooltipImage} />
                        </div>
                      </div>
                      <div className={styles.newReleaseRating}>
                        <span className={styles.newReleaseStars}>★ {game.rating.toFixed(1)}</span>
                        <span className={styles.newReleaseDate}>{formatReleaseDate(game.release_date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <a href="#" className={styles.viewAllLink}>View all new releases →</a>
              </div>
              
              {/* Top Rated */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}>🏆</div>
                  Top Rated
                </div>
                
                {topRatedGames.slice(0, 3).map((game, index) => (
                  <div key={game.id} className={styles.topRatedEntry}>
                    <div className={styles.topRatedRank}>{index + 1}</div>
                    <div className={styles.topRatedGame}>
                      <div>
                        <div className={`${styles.newReleaseName} ${styles.titleWithTooltip}`}>
                          {game.name}
                          <div className={styles.imageTooltip}>
                            <img src={game.cover} alt={game.name} className={styles.tooltipImage} />
                          </div>
                        </div>
                        <div className={styles.newReleaseRating}>
                          <span className={styles.newReleaseStars}>★ {game.rating.toFixed(1)}</span>
                          <span className={styles.genreTag}>{game.genres || 'Game'}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.percentRating}>{Math.round(game.rating * 20)}%</div>
                  </div>
                ))}
                
                <a href="#" className={styles.viewAllLink}>View all top rated →</a>
              </div>
              
              {/* Popular Categories */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}>📊</div>
                  Popular Categories
                </div>
                
                <div className={styles.categoriesGrid}>
                  <button className={styles.categoryButton}>Action</button>
                  <button className={styles.categoryButton}>RPG</button>
                  <button className={styles.categoryButton}>Adventure</button>
                  <button className={styles.categoryButton}>Strategy</button>
                  <button className={styles.categoryButton}>Simulation</button>
                  <button className={styles.categoryButton}>Sports</button>
                  <button className={styles.categoryButton}>Racing</button>
                  <button className={styles.categoryButton}>Horror</button>
                  <button className={styles.categoryButton}>Puzzle</button>
                </div>
                
                <button className={styles.viewAllButton}>View All</button>
              </div>
              
              {/* Upcoming Releases */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}>📅</div>
                  Upcoming Releases
                </div>
                
                {upcomingGames.slice(0, 3).map(game => {
                  const releaseDate = new Date(game.release_date! * 1000);
                  const month = releaseDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                  const day = releaseDate.getDate();
                  
                  return (
                    <div key={game.id} className={styles.upcomingEntry}>
                      <div className={styles.upcomingDate}>
                        <div className={styles.upcomingMonth}>{month}</div>
                        <div className={styles.upcomingDay}>{day}</div>
                      </div>
                      <div className={styles.upcomingInfo}>
                        <div className={`${styles.upcomingName} ${styles.titleWithTooltip}`}>
                          {game.name}
                          <div className={styles.imageTooltip}>
                            <img src={game.cover} alt={game.name} className={styles.tooltipImage} />
                          </div>
                        </div>
                        <div className={styles.upcomingGenre}>{game.genres || 'Game'}</div>
                      </div>
                      <button className={styles.remindButton}>Remind</button>
                    </div>
                  );
                })}
                
                <a href="#" className={styles.viewAllLink}>View full calendar →</a>
              </div>
            </div>
            
            {/* Explore by Platform */}
            <div className={styles.platformsSection}>
              <div className={styles.platformsHeader}>
                <div className={styles.platformsIcon}>🎮</div>
                <div className={styles.platformsTitle}>Explore by Platform</div>
              </div>
              
              <div className={styles.platformsGrid}>
                {platforms.map(platform => (
                  <div key={platform.id} className={styles.platformCard}>
                    <PlatformImage
                      src={platform.icon}
                      alt={platform.name}
                      className={styles.platformIcon}
                    />
                    <div className={styles.platformName}>{platform.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
