"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Modal from './Modal';
import styles from '../../styles/GameCalendarModal.module.css';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaSpinner, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([PLATFORMS.PS5]);
  const [year, setYear] = useState(2025);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CalendarGames>({});
  const [activeQuarter, setActiveQuarter] = useState(1); // 1-4 pour Q1-Q4
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [gamesPerPage, setGamesPerPage] = useState(10); // Increased from 5 to 10
  const [currentPage, setCurrentPage] = useState(1);
  const monthRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const router = useRouter();
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlatforms([PLATFORMS.PS5]);
      setYear(2025);
      setSearchTerm('');
      setActiveQuarter(1);
      setSelectedMonth(null);
      
      // Déterminer quel trimestre actif en fonction du mois actuel
      const currentMonth = new Date().getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);
      setActiveQuarter(currentQuarter);
    }
  }, [isOpen]);

  // Months array for display order
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Trimestres et leurs mois associés
  const quarters = {
    1: ['January', 'February', 'March'],
    2: ['April', 'May', 'June'],
    3: ['July', 'August', 'September'],
    4: ['October', 'November', 'December']
  };
  
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
    if (selectedPlatforms.includes(platformId)) {
      return;
    }
    setSelectedPlatforms([platformId]);
  };
  
  const handleGameClick = (gameId: number) => {
    sessionStorage.setItem('cameFromCalendar', 'true');
    router.push(`/games/${gameId}`);
    onClose();
  };
  
  // Get the day number from timestamp
  const getDayFromTimestamp = (timestamp: number): number => {
    return new Date(timestamp * 1000).getDate();
  };
  
  // Format date for list view
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };
  
  // Navigation années
  const changeYear = (increment: number) => {
    setYear(prevYear => prevYear + increment);
  };
  
  // Scroll to a specific month
  const scrollToMonth = (month: string) => {
    setSelectedMonth(month);
    if (monthRefs.current[month]) {
      monthRefs.current[month]?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  // Implement debounce for search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Wait 300ms after typing stops
    
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchTerm]);
  
  // Optimize search by using the debounced value and memoizing results
  useEffect(() => {
    // Don't search for very short terms
    if (debouncedSearchTerm.length < 2) {
      setSearchResults({});
      return;
    }
    
    // Create optimized search results
    const results: CalendarGames = {};
    const searchTermLower = debouncedSearchTerm.toLowerCase();
    
    Object.keys(calendarGames).forEach((month) => {
      if (!calendarGames[month]) return;
      
      // Use more efficient filtering and limit results per month to improve performance
      const matchingGames = calendarGames[month]
        .filter(game => game.name.toLowerCase().includes(searchTermLower))
        .slice(0, 10); // Limit to 10 games per month to prevent performance issues
      
      if (matchingGames.length > 0) {
        results[month] = matchingGames;
      }
    });
    
    setSearchResults(results);
  }, [debouncedSearchTerm, calendarGames]);
  
  // Modify this to use the optimized search results
  const filteredGames = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      // No search term, show regular calendar
      return calendarGames;
    }
    
    // Return pre-computed search results instead of re-filtering on every render
    return searchResults;
  }, [debouncedSearchTerm, calendarGames, searchResults]);
  
  // Vérifier si un trimestre a des jeux
  const hasGamesInQuarter = (quarter: number): boolean => {
    return quarters[quarter as keyof typeof quarters].some(month => 
      filteredGames[month] && filteredGames[month].length > 0
    );
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      className={styles.calendarModal}
    >
      <div className={styles.calendarModalContent}>
        {/* En-tête avec navigation d'année et recherche */}
        <div className={styles.calendarHeader}>
          <div className={styles.yearNavigation}>
            <button 
              className={styles.yearButton}
              onClick={() => changeYear(-1)}
              aria-label="Previous year"
            >
              <FaChevronLeft size={14} />
            </button>
            <div className={styles.yearSelector}>
              <FaCalendarAlt size={16} />
              <span>Game Releases {year}</span>
            </div>
            <button 
              className={styles.yearButton}
              onClick={() => changeYear(1)}
              aria-label="Next year"
            >
              <FaChevronRight size={14} />
            </button>
          </div>
          
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} size={14} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={`Search game in ${searchTerm.length < 2 ? 'calendar' : 'all of ' + year}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm.length > 0 && debouncedSearchTerm !== searchTerm && (
              <div className={styles.searchingIndicator}>Searching...</div>
            )}
          </div>
        </div>
        
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
        
        {/* Onglets de trimestre */}
        <div className={styles.quarterTabs}>
          {[1, 2, 3, 4].map(quarter => (
            <div 
              key={quarter}
              className={`${styles.quarterTab} ${activeQuarter === quarter ? styles.quarterTabActive : ''}`}
              onClick={() => setActiveQuarter(quarter)}
            >
              Q{quarter}
            </div>
          ))}
        </div>
        
        {/* Navigation par mois */}
        <div className={styles.monthNavigation}>
          {quarters[activeQuarter as keyof typeof quarters].map(month => (
            <div 
              key={month}
              className={`${styles.monthNavItem} ${selectedMonth === month ? styles.monthNavActive : ''}`}
              onClick={() => scrollToMonth(month)}
            >
              {month}
            </div>
          ))}
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.loadingSpinner} />
            <p>Loading calendar data...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>{error}</div>
        ) : debouncedSearchTerm.length > 0 && Object.values(searchResults).flat().length === 0 ? (
          <div className={styles.emptyQuarterMessage}>
            No games found matching "{debouncedSearchTerm}"
          </div>
        ) : !hasGamesInQuarter(activeQuarter) && !debouncedSearchTerm.trim() ? (
          <div className={styles.emptyQuarterMessage}>
            No releases found for Q{activeQuarter} {year} with the current filters.
          </div>
        ) : (
          <div className={styles.listView}>
            {months.map(month => {
              // Only show months from the active quarter unless we're searching
              if (!debouncedSearchTerm && !quarters[activeQuarter as keyof typeof quarters].includes(month)) {
                return null;
              }
              
              // Skip empty months
              if (!filteredGames[month] || filteredGames[month].length === 0) {
                return null;
              }
              
              return (
                <div 
                  key={month} 
                  className={styles.listMonth}
                  ref={el => { monthRefs.current[month] = el; }}
                >
                  <div className={styles.listMonthHeader}>
                    <h3>{month} {year}</h3>
                    <span>{filteredGames[month].length} {filteredGames[month].length === 1 ? 'game' : 'games'}</span>
                  </div>
                  <div className={styles.listMonthGames}>
                    {filteredGames[month].map(game => (
                      <div 
                        key={game.id} 
                        className={styles.listGame}
                        onClick={() => handleGameClick(game.id)}
                      >
                        <div className={styles.listGameDate}>
                          {formatDate(game.release_date)}
                        </div>
                        <div className={styles.listGameImage}>
                          <img src={game.cover} alt={game.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        </div>
                        <div className={styles.listGameInfo}>
                          <div className={styles.listGameTitle}>{game.name}</div>
                          <div className={styles.listGamePlatforms}>
                            {game.platforms.map(platformId => (
                              <span key={platformId} className={styles.platformIcon}>
                                <PlatformImage platformId={platformId} alt="" size={16} />
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GameCalendarModal;
