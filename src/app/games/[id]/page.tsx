import Image from 'next/image';
import Link from 'next/link';
import { FiStar, FiCalendar, FiMonitor, FiUsers, FiArrowLeft } from 'react-icons/fi';
import { BadgeCheck, Share2 } from 'lucide-react';
import styles from '../../../styles/GameDetail.module.css';
import { Button } from '@/components/ui/button';
import GameCard from '@/components/GameCard';
import SearchBar from '@/components/SearchBar';
import GameVideosWrapper from '@/components/GameVideosWrapper';
import SkeletonGameDetail from '@/components/SkeletonGameDetail';
import ScreenshotGallery from '@/components/ScreenshotGallery';
import BackButton from '@/components/BackButton';

interface Developer {
  name: string;
}

interface Publisher {
  name: string;
}

interface ReleaseDate {
  date: number;
  platform: string;
}

interface Screenshot {
  id: string;
  url: string;
}

interface SimilarGame {
  id: number;
  name: string;
  cover: string;
}

interface GameDetail {
  id: number;
  name: string;
  summary: string;
  storyline?: string;
  cover: string;
  screenshots: string[];
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  releaseDates: ReleaseDate[];
  rating: number;
  ratingCount: number;
  similarGames: SimilarGame[];
}

// Helper to format date
function formatReleaseDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'Date inconnue';
  }
  
  try {
    const date = new Date(timestamp * 1000);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Date inconnue';
    }
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date inconnue';
  }
}

async function getGameDetail(id: string): Promise<GameDetail | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/games/${id}`, 
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch game details');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
  }
}

export default async function GameDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  // Prefetch related data in background
  fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/game-videos/${id}`, { 
    cache: 'force-cache' 
  }).catch(e => console.log('Préchargement des vidéos en arrière-plan'));
  
  const gameDetail = await getGameDetail(id);
  
  if (!gameDetail) {
    return (
      <div className={styles.errorContainer}>
        <h1>Game Not Found</h1>
        <p>The game you're looking for doesn't exist or there was an error.</p>
        <Link href="/" className={styles.backLink}>
          <FiArrowLeft className={styles.backIcon} /> Return to Home
        </Link>
      </div>
    );
  }
  
  // Find the earliest release date
  const earliestRelease = gameDetail.releaseDates.length > 0 
    ? gameDetail.releaseDates.reduce((earliest, current) => 
        current.date < earliest.date ? current : earliest, 
        gameDetail.releaseDates[0]
      ) 
    : null;
  
  return (
    <div className={styles.gameDetailContainer}>
      <div className={styles.topBar}>
        <BackButton />
        <div className={styles.searchBarContainer}>
          <SearchBar />
        </div>
      </div>
      
      <div className={styles.gameHeader}>
        <div className={styles.coverWrapper}>
          <img 
            src={gameDetail.cover} 
            alt={gameDetail.name} 
            className={styles.gameCover} 
          />
        </div>
        
        <div className={styles.gameHeaderInfo}>
          <h1 className={styles.gameTitle}>{gameDetail.name}</h1>
          
          <div className={styles.gameMeta}>
            {gameDetail.genres.length > 0 && (
              <div className={styles.gameGenres}>
                {gameDetail.genres.join(' • ')}
              </div>
            )}
            
            <div className={styles.gameRatingBlock}>
              <div className={styles.gameRating}>
                <FiStar className={styles.starIcon} />
                <span>{(gameDetail.rating / 20).toFixed(1)}</span>
              </div>
              <div className={styles.ratingCount}>
                {gameDetail.ratingCount.toLocaleString()} ratings
              </div>
            </div>
          </div>
          
          <div className={styles.gameActions}>
            <Button className={styles.primaryButton}>
              Add to Collection
            </Button>
          </div>
          
          {earliestRelease && (
            <div className={styles.releaseInfo}>
              <FiCalendar className={styles.infoIcon} />
              <span>Released: {formatReleaseDate(earliestRelease.date)}</span>
            </div>
          )}
          
          {gameDetail.developers.length > 0 && (
            <div className={styles.developerInfo}>
              <FiUsers className={styles.infoIcon} />
              <span>Developer: {gameDetail.developers.join(', ')}</span>
            </div>
          )}
          
          {gameDetail.platforms.length > 0 && (
            <div className={styles.platformInfo}>
              <FiMonitor className={styles.infoIcon} />
              <span>Platforms: {gameDetail.platforms.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.gameContent}>
        <div className={styles.gameMainContent}>
          <section className={styles.gameSummary}>
            <h2>About</h2>
            <p>{gameDetail.summary}</p>
            {gameDetail.storyline && (
              <>
                <h3>Storyline</h3>
                <p>{gameDetail.storyline}</p>
              </>
            )}
          </section>
          
          {/* Game Videos Section */}
          <GameVideosWrapper gameId={parseInt(id)} />
          
          {gameDetail.screenshots.length > 0 && (
            <section className={styles.gameScreenshots}>
              <h2>Screenshots</h2>
              <ScreenshotGallery 
                screenshots={gameDetail.screenshots} 
                gameName={gameDetail.name} 
              />
            </section>
          )}
          
        </div>
        
        <aside className={styles.gameSidebar}>
          {gameDetail.publishers.length > 0 && (
            <div className={styles.sidebarSection}>
              <h3>Publishers</h3>
              <div className={styles.sidebarContent}>
                {gameDetail.publishers.join(', ')}
              </div>
            </div>
          )}
          
          {gameDetail.releaseDates.length > 0 && (
            <div className={styles.sidebarSection}>
              <h3>Release Dates</h3>
              <div className={styles.sidebarContent}>
                <ul className={styles.releaseDatesList}>
                  {gameDetail.releaseDates.map((release, index) => (
                    <li key={index}>
                      <span className={styles.releasePlatform}>{release.platform}:</span>
                      <span className={styles.releaseDate}>{formatReleaseDate(release.date)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
