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

// Message d'erreur simple pour les sections
const ErrorMessage = ({ message }: { message: string }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#b3b3b3' }}>
    <p>{message}</p>
  </div>
);

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

    // Parse responses with minimal fallbacks
    const featuredGame = featuredRes.ok ? await featuredRes.json() : null;
    const recommendedGames = recommendedRes.ok ? await recommendedRes.json() : [];
    const topRatedGames = topRatedRes.ok ? await topRatedRes.json() : [];
    const upcomingGames = upcomingRes.ok ? await upcomingRes.json() : [];
    const newReleaseGames = newReleasesRes.ok ? await newReleasesRes.json() : [];
    const platforms = platformsRes.ok ? await platformsRes.json() : [];

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

// Helper to format date
function formatReleaseDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export default async function Home() {
  const { featuredGame, recommendedGames, topRatedGames, upcomingGames, newReleaseGames, platforms } = await getData();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo-avalanche.png" alt="Avalanche" width={100} height={30} />
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
            
            {/* Editor's Choice avec message d'erreur si besoin */}
            {featuredGame ? (
              <div className={styles.editorChoice} style={{
                backgroundColor: '#2a1a66', 
                backgroundImage: 'linear-gradient(135deg, #2a1a66 0%, #6c5ce7 100%)'
              }}>
                <div className={styles.editorChoiceBadge}>Editor's Choice</div>
                <div className={styles.editorChoiceContent}>
                  <h2 className={styles.editorChoiceTitle}>{featuredGame.name}</h2>
                  <p className={styles.editorChoiceDescription}>
                    {featuredGame.description || "No description available"}
                  </p>
                  <div className={styles.editorChoiceRating}>
                    <div className={styles.editorChoiceStars}>
                      {'★'.repeat(Math.floor(featuredGame.rating || 0))}{'☆'.repeat(5 - Math.floor(featuredGame.rating || 0))}
                    </div>
                    <span className={styles.editorChoiceReviews}>
                      {featuredGame.rating?.toFixed(1) || "N/A"} 
                      {featuredGame.reviews ? ` (${featuredGame.reviews} reviews)` : ""}
                    </span>
                  </div>
                  <button className={styles.viewDetailsButton}>View Details</button>
                </div>
              </div>
            ) : (
              <ErrorMessage message="Aucun jeu en vedette trouvé" />
            )}

            <section className={styles.gameSection}>
              <div className={styles.sectionHeader}>
                <h2>Recommended For You</h2>
                <a href="#" className={styles.viewAll}>View All <span>→</span></a>
              </div>
              {recommendedGames.length > 0 ? (
                <div className={styles.gameGrid}>
                  {recommendedGames.map((game: Game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <ErrorMessage message="Aucune recommandation trouvée" />
              )}
            </section>
            
            <div className={styles.discoverSections}>
              {/* New Releases */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}>🆕</div>
                  New Releases
                </div>
                
                {newReleaseGames.length > 0 ? (
                  newReleaseGames.map((game: NewReleaseGame) => (
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
                  ))
                ) : (
                  <ErrorMessage message="Aucune nouvelle sortie trouvée" />
                )}
                
                {newReleaseGames.length > 0 && (
                  <a href="#" className={styles.viewAllLink}>View all new releases →</a>
                )}
              </div>
              
              {/* Top Rated */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}>🏆</div>
                  Top Rated
                </div>
                
                {topRatedGames.length > 0 ? (
                  topRatedGames.slice(0, 3).map((game: Game, index: number) => (
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
                  ))
                ) : (
                  <ErrorMessage message="Aucun jeu bien noté trouvé" />
                )}
                
                {topRatedGames.length > 0 && (
                  <a href="#" className={styles.viewAllLink}>View all top rated →</a>
                )}
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
                
                {upcomingGames.length > 0 ? (
                  upcomingGames.slice(0, 3).map((game: UpcomingGame) => {
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
                  })
                ) : (
                  <ErrorMessage message="Aucune sortie à venir trouvée" />
                )}
                
                {upcomingGames.length > 0 && (
                  <a href="#" className={styles.viewAllLink}>View full calendar →</a>
                )}
              </div>
            </div>
            
            {/* Explore by Platform */}
            <div className={styles.platformsSection}>
              <div className={styles.platformsHeader}>
                <div className={styles.platformsIcon}>🎮</div>
                <div className={styles.platformsTitle}>Explore by Platform</div>
              </div>
              
              {platforms.length > 0 ? (
                <div className={styles.platformsGrid}>
                  {platforms.map((platform: Platform) => (
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
              ) : (
                <ErrorMessage message="Aucune plateforme trouvée" />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
