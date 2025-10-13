"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './Modal';
import styles from '../../styles/GameCalendarModal.module.css';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaSpinner, FaSearch, FaChevronLeft, FaChevronRight, FaArrowUp } from 'react-icons/fa';
import PlatformImage from '../PlatformImage';

// Types
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

// Constants
const PLATFORMS = {
  PS5: 167,
  XBOX: 169,
  SWITCH: 130,
  PC: 6,
  MOBILE: 34
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const QUARTERS = {
  1: ['January', 'February', 'March'],
  2: ['April', 'May', 'June'],
  3: ['July', 'August', 'September'],
  4: ['October', 'November', 'December']
};

// Sub-components
interface CalendarHeaderProps {
  year: number;
  changeYear: (increment: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ 
  year, 
  changeYear, 
  searchTerm, 
  setSearchTerm, 
  isSearching 
}) => (
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
        placeholder={`Search games in ${year}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {isSearching && (
        <div className={styles.searchingIndicator}>Searching...</div>
      )}
    </div>
  </div>
);

interface PlatformFiltersProps {
  selectedPlatforms: number[];
  togglePlatformFilter: (platformId: number) => void;
}

const PlatformFilters: React.FC<PlatformFiltersProps> = ({ 
  selectedPlatforms, 
  togglePlatformFilter 
}) => (
  <div className={styles.platformFilters}>
    <div className={styles.filtersTitle}>Filter by Platform:</div>
    <div className={styles.platformButtons}>
      {Object.entries(PLATFORMS).map(([key, id]) => (
        <button 
          key={`${key}-${id}`}
          className={`${styles.platformButton} ${selectedPlatforms.includes(id) ? styles.platformButtonActive : ''}`}
          onClick={() => togglePlatformFilter(id)}
        >
          <PlatformImage 
            platformId={id} 
            platformName={key === 'MOBILE' ? 'Mobile' : undefined} 
            alt={key} 
            size={18} 
          />
          <span>{key === 'MOBILE' ? 'Mobile' : key}</span>
        </button>
      ))}
    </div>
  </div>
);

interface QuarterTabsProps {
  activeQuarter: number;
  setActiveQuarter: (quarter: number) => void;
}

const QuarterTabs: React.FC<QuarterTabsProps> = ({ 
  activeQuarter, 
  setActiveQuarter 
}) => (
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
);

interface MonthNavigationProps {
  activeQuarter: number;
  selectedMonth: string | null;
  scrollToMonth: (month: string) => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({ 
  activeQuarter, 
  selectedMonth, 
  scrollToMonth 
}) => (
  <div className={styles.monthNavigation}>
    {QUARTERS[activeQuarter as keyof typeof QUARTERS].map(month => (
      <div 
        key={month}
        className={`${styles.monthNavItem} ${selectedMonth === month ? styles.monthNavActive : ''}`}
        onClick={() => scrollToMonth(month)}
      >
        {month}
      </div>
    ))}
  </div>
);

interface GameItemProps {
  game: Game;
  formatDate: (timestamp: number) => string;
  onGameClick: (gameId: number) => void;
}

const GameItem: React.FC<GameItemProps> = ({ 
  game, 
  formatDate, 
  onGameClick 
}) => (
  <div 
    className={styles.listGame}
    onClick={() => onGameClick(game.id)}
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
        {game.platforms.map((platformId, idx) => (
          <span key={`${platformId}-${idx}`} className={styles.platformIcon}>
            <PlatformImage platformId={platformId} alt="" size={16} />
          </span>
        ))}
      </div>
    </div>
  </div>
);

interface MonthSectionProps {
  month: string;
  year: number;
  games: Game[];
  formatDate: (timestamp: number) => string;
  onGameClick: (gameId: number) => void;
  setRef: (el: HTMLDivElement | null) => void;
}

const MonthSection: React.FC<MonthSectionProps> = ({ 
  month, 
  year, 
  games, 
  formatDate, 
  onGameClick,
  setRef
}) => (
  <div className={styles.listMonth} ref={setRef}>
    <div className={styles.listMonthHeader}>
      <h3>{month} {year}</h3>
      <span>{games.length} {games.length === 1 ? 'game' : 'games'}</span>
    </div>
    <div className={styles.listMonthGames}>
      {games.map((game, idx) => (
        <GameItem 
          key={`${game.id}-${idx}`} 
          game={game} 
          formatDate={formatDate} 
          onGameClick={onGameClick} 
        />
      ))}
    </div>
  </div>
);

interface StatusDisplayProps {
  loading: boolean;
  error: string | null;
  searchTerm: string;
  hasResults: boolean;
  activeQuarter: number;
  year: number;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ 
  loading, 
  error, 
  searchTerm, 
  hasResults, 
  activeQuarter,
  year
}) => {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p>Loading calendar data...</p>
      </div>
    );
  }
  
  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }
  
  if (searchTerm && !hasResults) {
    return (
      <div className={styles.emptyQuarterMessage}>
        No games found matching "{searchTerm}"
      </div>
    );
  }
  
  if (!hasResults) {
    return (
      <div className={styles.emptyQuarterMessage}>
        No releases found for Q{activeQuarter} {year} with the current filters.
      </div>
    );
  }
  
  return null;
};

// Main component
const GameCalendarModal: React.FC<GameCalendarModalProps> = ({ isOpen, onClose }) => {
  // State
  const [calendarGames, setCalendarGames] = useState<CalendarGames>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([PLATFORMS.PS5]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CalendarGames>({});
  const [activeQuarter, setActiveQuarter] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  // Refs
  const monthRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const contentRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      // Initialize with current year and quarter
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);
      
      setSelectedPlatforms([PLATFORMS.PS5]);
      setYear(currentYear);
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setSearchResults({});
      setActiveQuarter(currentQuarter);
      setSelectedMonth(null);
    }
  }, [isOpen]);
  
  // Fetch games when dependencies change
  useEffect(() => {
    if (isOpen) {
      fetchCalendarGames();
    }
  }, [isOpen, selectedPlatforms, year]);
  
  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);
  
  // Process search results
  useEffect(() => {
    if (debouncedSearchTerm.length < 2) {
      setSearchResults({});
      return;
    }
    
    const results: CalendarGames = {};
    const searchTermLower = debouncedSearchTerm.toLowerCase();
    
    Object.keys(calendarGames).forEach((month) => {
      if (!calendarGames[month]) return;
      
      const matchingGames = calendarGames[month]
        .filter(game => game.name.toLowerCase().includes(searchTermLower))
        .slice(0, 10); // Limit results for performance
      
      if (matchingGames.length > 0) {
        results[month] = matchingGames;
      }
    });
    
    setSearchResults(results);
  }, [debouncedSearchTerm, calendarGames]);
  
  // Handlers
  const fetchCalendarGames = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
    // Clear all navigation flags first to avoid conflicts
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromHome');
    sessionStorage.removeItem('cameFromProfile');
    sessionStorage.removeItem('cameFromCollection');
    
    // Set the calendar flag
    sessionStorage.setItem('cameFromCalendar', 'true');
    router.push(`/games/${gameId}`);
    onClose();
  };
  
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };
  
  const changeYear = (increment: number) => {
    setYear(prevYear => prevYear + increment);
  };
  
  const scrollToMonth = (month: string) => {
    setSelectedMonth(month);
    if (monthRefs.current[month]) {
      monthRefs.current[month]?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Swipe between quarters
    if (isLeftSwipe && activeQuarter < 4) {
      setActiveQuarter(activeQuarter + 1);
    }
    if (isRightSwipe && activeQuarter > 1) {
      setActiveQuarter(activeQuarter - 1);
    }
  };
  
  // Handle scroll to show/hide scroll to top button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    setShowScrollTop(scrollTop > 300);
  };
  
  // Scroll to top function
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // Derived state
  const filteredGames = useMemo(() => {
    if (debouncedSearchTerm.trim()) {
      return searchResults;
    }
    return calendarGames;
  }, [debouncedSearchTerm, calendarGames, searchResults]);
  
  const hasGamesInQuarter = (quarter: number): boolean => {
    return QUARTERS[quarter as keyof typeof QUARTERS].some(month => 
      filteredGames[month] && filteredGames[month].length > 0
    );
  };
  
  const isSearching = searchTerm.length > 0 && debouncedSearchTerm !== searchTerm;
  
  const hasSearchResults = debouncedSearchTerm.trim() 
    ? Object.values(searchResults).flat().length > 0
    : true;
  
  // Render
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="🎮 Release Calendar"
      className={styles.calendarModal}
    >
      <div 
        ref={contentRef}
        className={styles.calendarModalContent}
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Calendar Header */}
        <CalendarHeader 
          year={year} 
          changeYear={changeYear} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          isSearching={isSearching}
        />
        
        {/* Platform Filters */}
        <PlatformFilters 
          selectedPlatforms={selectedPlatforms} 
          togglePlatformFilter={togglePlatformFilter} 
        />
        
        {/* Quarter Tabs */}
        <QuarterTabs 
          activeQuarter={activeQuarter} 
          setActiveQuarter={setActiveQuarter}
        />
        
        {/* Month Navigation */}
        <MonthNavigation 
          activeQuarter={activeQuarter} 
          selectedMonth={selectedMonth} 
          scrollToMonth={scrollToMonth}
        />
        
        {/* Status Display (Loading/Error/Empty) */}
        <StatusDisplay 
          loading={loading}
          error={error}
          searchTerm={debouncedSearchTerm.trim()}
          hasResults={debouncedSearchTerm.trim() 
            ? Object.values(searchResults).flat().length > 0 
            : hasGamesInQuarter(activeQuarter)
          }
          activeQuarter={activeQuarter}
          year={year}
        />
        
        {/* Game List */}
        {!loading && !error && (
          <div className={styles.listView}>
            {MONTHS.map(month => {
              // Skip months not in active quarter (unless searching)
              if (!debouncedSearchTerm && !QUARTERS[activeQuarter as keyof typeof QUARTERS].includes(month)) {
                return null;
              }
              
              // Skip empty months
              if (!filteredGames[month] || filteredGames[month].length === 0) {
                return null;
              }
              
              return (
                <MonthSection 
                  key={month}
                  month={month}
                  year={year}
                  games={filteredGames[month]}
                  formatDate={formatDate}
                  onGameClick={handleGameClick}
                  setRef={(el) => { monthRefs.current[month] = el; }}
                />
              );
            })}
          </div>
        )}
        
        {/* Scroll to Top Button */}
        <button 
          className={`${styles.scrollToTopButton} ${showScrollTop ? styles.visible : ''}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <FaArrowUp />
        </button>
      </div>
    </Modal>
  );
};

export default GameCalendarModal;
