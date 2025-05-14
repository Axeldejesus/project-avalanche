import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import GameCard from '../components/GameCard';
import PlatformImage from '../components/PlatformImage';
import AuthButtonsWrapper from '../components/AuthButtonsWrapper';
import SearchBar from '../components/SearchBar';

// React Icons
import { FiSearch, FiHome, FiTrendingUp, FiPackage } from 'react-icons/fi';
import { RiTrophyLine, RiCalendarEventLine, RiGamepadFill } from 'react-icons/ri';
import { BiCategoryAlt } from 'react-icons/bi';
import { BsCollectionPlay } from 'react-icons/bs';

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
  rating?: number; // Adding rating field for consistency
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
    const [recommendedRes, topRatedRes, upcomingRes, newReleasesRes, platformsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/recommended-games`, { next: { revalidate: 10 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/top-rated-games`, { next: { revalidate: 10 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upcoming-games`, { next: { revalidate: 10 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/new-releases`, { next: { revalidate: 10 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/platforms`, { next: { revalidate: 10 } })
    ]);

    // Parse responses with minimal fallbacks
    const recommendedGames = recommendedRes.ok ? await recommendedRes.json() : [];
    const topRatedGames = topRatedRes.ok ? await topRatedRes.json() : [];
    const upcomingGames = upcomingRes.ok ? await upcomingRes.json() : [];
    const newReleaseGames = newReleasesRes.ok ? await newReleasesRes.json() : [];
    const platforms = platformsRes.ok ? await platformsRes.json() : [];


    return {
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
      <Header />

      <div className={styles.mainLayout}>
        <Sidebar />
        
        <main className={styles.main}>
          <div className={styles.discoverContainer}>
            
            {/* Promotional Banner */}
            <div className={styles.promotionalBanner}>
              <div className={styles.bannerContent}>
                <h1 className={styles.bannerTitle}>
                  Discover Your Next Gaming Adventure
                </h1>
                <p className={styles.bannerDescription}>
                  Avalanche brings you the ultimate gaming platform with personalized recommendations, 
                  exclusive content, and a community of passionate gamers.
                </p>
                <button className={styles.viewDetailsButton}>
                  Explore Now
                </button>
              </div>
            </div>

            <section className={styles.gameSection}>
              <div className={styles.sectionHeader}>
                <h2>{styles.sectionHeaderIcon} Recommended For You</h2>
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
                  <div className={styles.sectionIcon}><FiPackage /></div>
                  New Releases
                </div>
                
                {newReleaseGames.length > 0 ? (
                  newReleaseGames.map((game: NewReleaseGame) => (
                    <Link href={`/games/${game.id}`} key={game.id} className={styles.newReleaseLink}>
                      <div className={styles.newReleaseCard}>
                        <img src={game.cover} alt={game.name} className={styles.newReleaseImage} />
                        <div className={styles.newReleaseInfo}>
                          <div className={`${styles.newReleaseName} ${styles.titleWithTooltip}`}>
                            {game.name}
                            <div className={styles.imageTooltip}>
                              <img src={game.cover} alt={game.name} className={styles.tooltipImage} />
                            </div>
                          </div>
                          <div className={styles.newReleaseRating}>
                            <span className={styles.newReleaseDate}>{formatReleaseDate(game.release_date)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <ErrorMessage message="Aucune nouvelle sortie trouvée" />
                )}
                
                {newReleaseGames.length > 0 && (
                  <a href="#" className={styles.viewAllLink}>View all new releases →</a>
                )}
              </div>
              
              {/* Upcoming Releases */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}><RiCalendarEventLine /></div>
                  Upcoming Releases
                </div>
                
                {upcomingGames.length > 0 ? (
                  upcomingGames.slice(0, 3).map((game: UpcomingGame) => (
                    <Link href={`/games/${game.id}`} key={game.id} className={styles.newReleaseLink}>
                      <div className={styles.newReleaseCard}>
                        <img src={game.cover} alt={game.name} className={styles.newReleaseImage} />
                        <div className={styles.newReleaseInfo}>
                          <div className={`${styles.newReleaseName} ${styles.titleWithTooltip}`}>
                            {game.name}
                            <div className={styles.imageTooltip}>
                              <img src={game.cover} alt={game.name} className={styles.tooltipImage} />
                            </div>
                          </div>
                          <div className={styles.newReleaseRating}>
                            <span className={styles.newReleaseDate}>{formatReleaseDate(game.release_date)}</span>
                            <span className={styles.upcomingGenre}>{game.genres || 'Game'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <ErrorMessage message="Aucune sortie à venir trouvée" />
                )}
                
                {upcomingGames.length > 0 && (
                  <a href="#" className={styles.viewAllLink}>View full calendar →</a>
                )}
              </div>
              
              {/* Explore by Platform - Now next to Upcoming Releases */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}><RiGamepadFill /></div>
                  Explore by Platform
                </div>
                
                {platforms.length > 0 ? (
                  <div className={styles.platformsCompactGrid}>
                    {platforms
                      .filter((platform: Platform) => {
                        // Keep only PS5, Xbox, PC, and Switch
                        const platformId = platform.id;
                        return platformId === 167 || // PS5
                               platformId === 169 || // Xbox Series
                               platformId === 6 ||   // PC
                               platformId === 130;   // Switch
                      })
                      .map((platform: Platform) => (
                        <div key={platform.id} className={styles.platformCompactCard}>
                          <PlatformImage
                            platformId={platform.id}
                            platformName={platform.name}
                            src={platform.icon}
                            alt={platform.name}
                            className={styles.platformCompactIcon}
                            size={24} // Smaller size
                          />
                          <div className={styles.platformCompactName}>{platform.name}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <ErrorMessage message="Aucune plateforme trouvée" />
                )}
                
                <a href="#" className={styles.viewAllLink}>View full platforms →</a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
