"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../styles/Home.module.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import GameCard from '../components/GameCard';
import PlatformImage from '../components/PlatformImage';
import GameCalendarModal from '../components/modals/GameCalendarModal';

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
  rating?: number;
}

interface Platform {
  id: number;
  name: string;
  icon: string;
}

interface HomePageProps {
  recommendedGames: Game[];
  upcomingGames: UpcomingGame[];
  newReleaseGames: NewReleaseGame[];
  platforms: Platform[];
}

// Message d'erreur simple pour les sections
const ErrorMessage = ({ message }: { message: string }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#b3b3b3' }}>
    <p>{message}</p>
  </div>
);

// Helper to format date
function formatReleaseDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

const HomePage: React.FC<HomePageProps> = ({ 
  recommendedGames, 
  upcomingGames, 
  newReleaseGames, 
  platforms 
}) => {
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const router = useRouter();
  
  // Effet pour vérifier si on doit rouvrir la modal du calendrier
  useEffect(() => {
    const cameFromCalendar = sessionStorage.getItem('cameFromCalendar');
    if (cameFromCalendar === 'true') {
      // Rouvrir la modal si l'utilisateur vient de la modal du calendrier
      setIsCalendarModalOpen(true);
      // Nettoyer le flag après utilisation
      sessionStorage.removeItem('cameFromCalendar');
    }
  }, []);
  
  const openCalendarModal = () => {
    setIsCalendarModalOpen(true);
  };
  
  const closeCalendarModal = () => {
    setIsCalendarModalOpen(false);
  };

  // Nouvelle fonction pour naviguer vers la page de détail du jeu
  const navigateToGameDetail = (gameId: number, event: React.MouseEvent) => {
    event.preventDefault();
    // Définir le flag pour indiquer que l'utilisateur vient de la page d'accueil
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.setItem('cameFromHome', 'true');
    router.push(`/games/${gameId}`);
  };

  // Fonction pour naviguer vers la page des jeux avec un filtre de plateforme
  const navigateToGamesWithPlatform = (platformId: number, event: React.MouseEvent) => {
    event.preventDefault();
    sessionStorage.setItem('gameFilters', JSON.stringify({
      platforms: [platformId],
      genres: [],
      releaseYear: null,
      searchQuery: '',
      releaseStatus: 'all',
      sort: 'default'
    }));
    router.push('/games');
  };
  
  // Fonction pour naviguer vers la page des jeux avec le filtre "Released Games"
  const navigateToNewReleases = (event: React.MouseEvent) => {
    event.preventDefault();
    sessionStorage.setItem('gameFilters', JSON.stringify({
      platforms: [],
      genres: [],
      releaseYear: null,
      searchQuery: '',
      releaseStatus: 'released',
      sort: 'release_desc' // Tri par date de sortie décroissante
    }));
    router.push('/games');
  };
  
  // Fonction pour naviguer vers la page des jeux sans filtre
  const navigateToGames = (event: React.MouseEvent) => {
    event.preventDefault();
    // Nettoyer les filtres précédents
    sessionStorage.removeItem('gameFilters');
    router.push('/games');
  };

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
                <h2>Recommended For You</h2>
                <a href="#" className={styles.viewAll} onClick={navigateToGames}>View All <span>→</span></a>
              </div>
              {recommendedGames.length > 0 ? (
                <div className={styles.gameGrid}>
                  {recommendedGames.map((game, idx) => (
                    <GameCard key={`${game.id}-${idx}`} game={game} />
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
                  newReleaseGames.map((game, idx) => (
                    <div 
                      key={`${game.id}-${idx}`} 
                      className={styles.newReleaseCard} 
                      onClick={(e) => navigateToGameDetail(game.id, e)}
                      style={{ cursor: 'pointer' }}
                    >
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
                  ))
                ) : (
                  <ErrorMessage message="Aucune nouvelle sortie trouvée" />
                )}
                
                {newReleaseGames.length > 0 && (
                  <a href="#" className={styles.viewAllLink} onClick={navigateToNewReleases}>View all new releases →</a>
                )}
              </div>
              
              {/* Upcoming Releases */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}><RiCalendarEventLine /></div>
                  Upcoming Releases
                </div>
                
                {upcomingGames.length > 0 ? (
                  upcomingGames.slice(0, 3).map((game, idx) => (
                    <div 
                      key={`${game.id}-${idx}`} 
                      className={styles.newReleaseCard} 
                      onClick={(e) => navigateToGameDetail(game.id, e)}
                      style={{ cursor: 'pointer' }}
                    >
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
                  ))
                ) : (
                  <ErrorMessage message="Aucune sortie à venir trouvée" />
                )}
                
                {upcomingGames.length > 0 && (
                  <a href="#" className={styles.viewAllLink} onClick={(e) => {
                    e.preventDefault();
                    openCalendarModal();
                  }}>View full calendar →</a>
                )}
              </div>
              
              {/* Explore by Platform */}
              <div className={styles.discoverSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.sectionIcon}><RiGamepadFill /></div>
                  Explore by Platform
                </div>
                
                {platforms.length > 0 ? (
                  <div className={styles.platformsCompactGrid}>
                    {platforms
                      .filter((platform) => {
                        const platformId = platform.id;
                        return platformId === 167 || platformId === 169 || platformId === 6 || platformId === 130;
                      })
                      .map((platform, idx) => (
                        <div 
                          key={`${platform.id}-${idx}`} 
                          className={styles.platformCompactCard}
                          onClick={(e) => navigateToGamesWithPlatform(platform.id, e)}
                          style={{ cursor: 'pointer' }}
                        >
                          <PlatformImage
                            platformId={platform.id}
                            platformName={platform.name}
                            src={platform.icon}
                            alt={platform.name}
                            className={styles.platformCompactIcon}
                            size={24}
                          />
                          <div className={styles.platformCompactName}>{platform.name}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <ErrorMessage message="Aucune plateforme trouvée" />
                )}
                
                <a href="#" className={styles.viewAllLink} onClick={navigateToGames}>View full platforms →</a>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <GameCalendarModal 
        isOpen={isCalendarModalOpen} 
        onClose={closeCalendarModal} 
      />
    </div>
  );
};

export default HomePage;
