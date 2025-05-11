import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft, FiStar, FiCalendar, FiMonitor, FiUsers } from 'react-icons/fi';
import { BadgeCheck, Share2 } from 'lucide-react';
import styles from '../../../styles/GameDetail.module.css';
import { Button } from '@/components/ui/button';
import GameCard from '@/components/GameCard';
import GameVideos from '@/components/GameVideos';

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
  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
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
  const gameDetail = await getGameDetail(params.id);
  
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
      <Link href="/" className={styles.backButton}>
        <FiArrowLeft /> Back to Home
      </Link>
      
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
            <Button variant="outline" className={styles.secondaryButton}>
              <BadgeCheck className={styles.actionIcon} /> Mark as Completed
            </Button>
            <Button variant="outline" className={styles.iconButton}>
              <Share2 className={styles.actionIcon} />
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
          <GameVideos gameId={parseInt(params.id)} />
          
          {gameDetail.screenshots.length > 0 && (
            <section className={styles.gameScreenshots}>
              <h2>Screenshots</h2>
              <div className={styles.screenshotsGrid}>
                {gameDetail.screenshots.map((screenshot, index) => (
                  <div key={index} className={styles.screenshotWrapper}>
                    <img 
                      src={screenshot} 
                      alt={`${gameDetail.name} screenshot ${index + 1}`} 
                      className={styles.screenshot} 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {gameDetail.similarGames.length > 0 && (
            <section className={styles.similarGames}>
              <h2>Similar Games</h2>
              <div className={styles.similarGamesGrid}>
                {gameDetail.similarGames.map(game => (
                  <Link href={`/games/${game.id}`} key={game.id}>
                    <div className={styles.similarGameCard}>
                      <img 
                        src={game.cover} 
                        alt={game.name} 
                        className={styles.similarGameCover} 
                      />
                      <div className={styles.similarGameTitle}>{game.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
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
