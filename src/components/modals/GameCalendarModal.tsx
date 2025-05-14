"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/GameCalendarModal.module.css';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import PlatformImage from '../PlatformImage';

interface Game {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  platforms: number[];
}

interface CalendarGames {
  [month: string]: Game[];
}

interface GameCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Platform IDs for filtering
const PLATFORMS = {
  PS5: 167,
  XBOX: 169,
  SWITCH: 130,
  PC: 6,
  MOBILE: 34 // Android (could be expanded to include iOS)
};

const GameCalendarModal: React.FC<GameCalendarModalProps> = ({ isOpen, onClose }) => {
  const [calendarGames, setCalendarGames] = useState<CalendarGames>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [year, setYear] = useState(2025); // Default to 2025 as specified
  const router = useRouter();
  
  // Months array for display order
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  useEffect(() => {
    if (isOpen) {
      fetchCalendarGames();
    }
  }, [isOpen, selectedPlatforms, year]);
  
  const fetchCalendarGames = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params for platforms if any are selected
      const platformParams = selectedPlatforms.length > 0 
        ? `platforms=${selectedPlatforms.join(',')}` 
        : '';
      
      const response = await fetch(`/api/calendar-games?year=${year}${platformParams ? `&${platformParams}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      
      const data = await response.json();
      setCalendarGames(data);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Could not load release calendar. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePlatformFilter = (platformId: number) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };
  
  const handleGameClick = (gameId: number) => {
    router.push(`/games/${gameId}`);
    onClose();
  };
  
  // Get the day number from timestamp
  const getDayFromTimestamp = (timestamp: number): number => {
    return new Date(timestamp * 1000).getDate();
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Game Releases Calendar ${year}`}
      className={styles.calendarModal}
    >
      <div className={styles.calendarModalContent}>
        <div className={styles.platformFilters}>
          <div className={styles.filtersTitle}>Filter by Platform:</div>
          <div className={styles.platformButtons}>
            <button 
              className={`${styles.platformButton} ${selectedPlatforms.includes(PLATFORMS.PS5) ? styles.platformButtonActive : ''}`}
              onClick={() => togglePlatformFilter(PLATFORMS.PS5)}
            >
              <PlatformImage platformId={PLATFORMS.PS5} alt="PS5" size={18} />
              <span>PS5</span>
            </button>
            <button 
              className={`${styles.platformButton} ${selectedPlatforms.includes(PLATFORMS.XBOX) ? styles.platformButtonActive : ''}`}
              onClick={() => togglePlatformFilter(PLATFORMS.XBOX)}
            >
              <PlatformImage platformId={PLATFORMS.XBOX} alt="Xbox" size={18} />
              <span>Xbox</span>
            </button>
            <button 
              className={`${styles.platformButton} ${selectedPlatforms.includes(PLATFORMS.SWITCH) ? styles.platformButtonActive : ''}`}
              onClick={() => togglePlatformFilter(PLATFORMS.SWITCH)}
            >
              <PlatformImage platformId={PLATFORMS.SWITCH} alt="Switch" size={18} />
              <span>Switch</span>
            </button>
            <button 
              className={`${styles.platformButton} ${selectedPlatforms.includes(PLATFORMS.PC) ? styles.platformButtonActive : ''}`}
              onClick={() => togglePlatformFilter(PLATFORMS.PC)}
            >
              <PlatformImage platformId={PLATFORMS.PC} alt="PC" size={18} />
              <span>PC</span>
            </button>
            <button 
              className={`${styles.platformButton} ${selectedPlatforms.includes(PLATFORMS.MOBILE) ? styles.platformButtonActive : ''}`}
              onClick={() => togglePlatformFilter(PLATFORMS.MOBILE)}
            >
              <PlatformImage platformName="Mobile" alt="Mobile" size={18} />
              <span>Mobile</span>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.loadingSpinner} />
            <p>Loading calendar data...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>{error}</div>
        ) : (
          <div className={styles.monthsGrid}>
            {months.map(month => (
              <div key={month} className={styles.monthCard}>
                <div className={styles.monthHeader}>
                  <h3>{month} {year}</h3>
                </div>
                <div className={styles.monthGames}>
                  {calendarGames[month] && calendarGames[month].length > 0 ? (
                    calendarGames[month].map(game => (
                      <div 
                        key={game.id} 
                        className={styles.calendarGame}
                        onClick={() => handleGameClick(game.id)}
                      >
                        <div className={styles.gameDateBadge}>
                          {getDayFromTimestamp(game.release_date)}
                        </div>
                        <div className={styles.gameImageContainer}>
                          <img src={game.cover} alt={game.name} className={styles.gameImage} />
                        </div>
                        <div className={styles.gameInfo}>
                          <div className={styles.gameName}>{game.name}</div>
                          <div className={styles.gamePlatforms}>
                            {game.platforms.map(platformId => (
                              <span key={platformId} className={styles.platformIcon}>
                                <PlatformImage platformId={platformId} alt="" size={14} />
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noGamesMessage}>No scheduled releases</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GameCalendarModal;
