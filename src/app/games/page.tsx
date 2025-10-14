'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { 
  ArrowLeft, ArrowRight, GamepadIcon, Filter, X, Search, Grid, List, 
  Star, Calendar, ArrowUp, RefreshCw, Check, ChevronUp, Tag, Package, Clock 
} from 'lucide-react';
import styles from './games.module.css';
import debounce from 'lodash/debounce';

interface Game {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres: string;
}

interface FilterOptions {
  platforms: number[];
  genres: number[];
  releaseYear: number | null;
  searchQuery: string;
  releaseStatus: 'all' | 'released' | 'upcoming';
  sort: string;
}

// Platform options
const PLATFORMS = [
  { id: 167, name: 'PlayStation 5' },
  { id: 169, name: 'Xbox Series X' },
  { id: 130, name: 'Nintendo Switch' },
  { id: 6, name: 'PC' },
  { id: 48, name: 'PlayStation 4' },
  { id: 49, name: 'Xbox One' },
];

// Generate years for dropdowns
const YEARS = Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i);

// Release status options
const RELEASE_STATUS = [
  { value: 'all', label: 'All Games' },
  { value: 'released', label: 'Released Games' },
  { value: 'upcoming', label: 'Upcoming Games' }
];

// Sort options
const SORT_OPTIONS = [
  { value: 'default', label: 'Default Sorting' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'release_desc', label: 'Recently Released' },
  { value: 'release_asc', label: 'Oldest First' },
  { value: 'name', label: 'Name (A-Z)' }
];

// Filter chips configuration
const FILTER_CHIPS = [
  { label: 'All Games', value: null, icon: <Tag size={16} /> },
  { label: 'Highest Rated', sort: 'rating', icon: <Star size={16} /> },
  { label: 'New Releases', sort: 'release_desc', status: 'released', icon: <Package size={16} /> },
  { label: 'Coming Soon', sort: 'release_asc', status: 'upcoming', icon: <Clock size={16} /> },
];

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    platforms: [],
    genres: [],
    releaseYear: null,
    searchQuery: '',
    releaseStatus: 'all',
    sort: 'default'
  });
  const [tempFilters, setTempFilters] = useState<FilterOptions>({
    platforms: [],
    genres: [],
    releaseYear: null,
    searchQuery: '',
    releaseStatus: 'all',
    sort: 'default'
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [genres, setGenres] = useState<{ id: number, name: string }[]>([]);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number | null>(0);
  const [isMobile, setIsMobile] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll handler for back to top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Initialize filters from session storage or default values
  useEffect(() => {
    sessionStorage.setItem('cameFromGames', 'true');
    
    const savedFilters = sessionStorage.getItem('gameFilters');
    
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        const validStatus = ['all', 'released', 'upcoming'].includes(parsedFilters.releaseStatus) 
          ? (parsedFilters.releaseStatus as 'all' | 'released' | 'upcoming') 
          : 'all';
        
        const initialFilters = {
          platforms: parsedFilters.platforms || [],
          genres: parsedFilters.genres || [],
          releaseYear: parsedFilters.releaseYear || null,
          searchQuery: parsedFilters.searchQuery || '',
          releaseStatus: validStatus,
          sort: parsedFilters.sort || 'default'
        };
        
        setFilters(initialFilters);
        setTempFilters(initialFilters);
        
        // Set selected chip based on the initial filters
        const chipIndex = FILTER_CHIPS.findIndex(chip => 
          (chip.sort === initialFilters.sort && chip.status === initialFilters.releaseStatus) ||
          (chip.value === null && initialFilters.sort === 'default' && initialFilters.releaseStatus === 'all')
        );
        setSelectedChip(chipIndex !== -1 ? chipIndex : null);
      } catch (error) {
        console.error('Error parsing saved filters:', error);
        resetFilters();
      }
    } else {
      resetFilters();
    }
    
    setFiltersInitialized(true);
    
    // Load saved view mode from local storage
    const savedViewMode = localStorage.getItem('gamesViewMode');
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      setViewMode(savedViewMode);
    }

    return () => {
      // We'll leave cameFromGames value in sessionStorage
    };
  }, []);

  // Load genres on mount
  useEffect(() => {
    fetchGenres();
  }, []);

  // Update active filters count when filters change
  useEffect(() => {
    let count = 0;
    if (filters.platforms.length > 0) count++;
    if (filters.genres.length > 0) count++;
    if (filters.releaseYear !== null) count++;
    if (filters.searchQuery.trim() !== '') count++;
    if (filters.releaseStatus !== 'all') count++;
    if (filters.sort !== 'default') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Reset the games list and fetch first page when filters change
  useEffect(() => {
    if (filtersInitialized) {
      setGames([]);
      setPage(1);
      setHasMore(true);
      fetchGames(1, true);
    }
  }, [filters, filtersInitialized]);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (loading) return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreGames();
      }
    };

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    observer.current = new IntersectionObserver(observerCallback, options);
    
    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('gamesViewMode', viewMode);
  }, [viewMode]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fetch genres
  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      if (response.ok) {
        const data = await response.json();
        const validGenres = data.filter((genre: any) => 
          genre && typeof genre.id === 'number' && genre.name && typeof genre.name === 'string'
        );
        setGenres(validGenres);
      }
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  // Fetch games with current filters
  const fetchGames = async (pageNumber: number, resetList: boolean = false) => {
    setLoading(true);
    try {
      // Build URL with filter parameters
      let url = `/api/games?page=${pageNumber}`;
      
      if (filters.platforms.length > 0) {
        url += `&platforms=${filters.platforms.join(',')}`;
      }
      
      if (filters.genres.length > 0) {
        url += `&genres=${filters.genres.join(',')}`;
      }
      
      if (filters.searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(filters.searchQuery.trim())}`;
      }
      
      if (filters.releaseYear !== null) {
        url += `&releaseYear=${filters.releaseYear}`;
      }
      
      if (filters.releaseStatus !== 'all') {
        url += `&releaseStatus=${filters.releaseStatus}`;
      }
      
      if (filters.sort !== 'default') {
        url += `&sort=${filters.sort}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      
      const data = await response.json();
      
      if (resetList) {
        setGames(data.games);
      } else {
        setGames(prev => [...prev, ...data.games]);
      }
      
      setHasMore(data.games.length > 0);
    } catch (err) {
      setError('Error loading games. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load more games for infinite scroll
  const loadMoreGames = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGames(nextPage);
    }
  };

  // Handle game card click
  const handleGameClick = (gameId: number) => {
    sessionStorage.setItem('gameFilters', JSON.stringify(filters));
    sessionStorage.setItem('cameFromGames', 'true');
    router.push(`/games/${gameId}`);
  };

  // Toggle filter panel
  const toggleFilter = () => {
    if (!isFilterOpen) {
      setTempFilters({...filters});
    }
    setIsFilterOpen(!isFilterOpen);
  };

  // Reset all filters
  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      platforms: [],
      genres: [],
      releaseYear: null,
      searchQuery: '',
      releaseStatus: 'all',
      sort: 'default'
    };
    
    setTempFilters(defaultFilters);
    
    if (!isFilterOpen) {
      setFilters(defaultFilters);
      sessionStorage.setItem('gameFilters', JSON.stringify(defaultFilters));
    }
    
    // Reset selected chip to "All Games"
    setSelectedChip(0);
  };

  // Apply the temp filters
  const applyFilters = () => {
    setFilters(tempFilters);
    sessionStorage.setItem('gameFilters', JSON.stringify(tempFilters));
    setIsFilterOpen(false);
  };

  // Handle search input changes with debounce
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters(prev => ({
        ...prev,
        searchQuery: value
      }));
      sessionStorage.setItem('gameFilters', JSON.stringify({
        ...filters,
        searchQuery: value
      }));
    }, 500),
    [filters]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Toggle view mode between grid and list
  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle filter chip selection with haptic feedback on mobile
  const handleChipSelect = (index: number) => {
    const chip = FILTER_CHIPS[index];
    setSelectedChip(index);
    
    // Haptic feedback for mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    const newFilters = {
      ...filters,
      sort: chip.sort || 'default',
      releaseStatus: (chip.status || 'all') as 'all' | 'released' | 'upcoming'
    };
    
    setFilters(newFilters);
    setTempFilters(newFilters);
    sessionStorage.setItem('gameFilters', JSON.stringify(newFilters));
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(8).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className={styles.skeletonCard}>
        <div className={styles.skeletonImage}></div>
        <div className={styles.skeletonContent}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonGenre}></div>
          <div className={styles.skeletonRating}></div>
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        <h1 className={styles.title}>Game Library</h1>
        <p className={styles.subtitle}>
          <GamepadIcon size={18} />
          Discover and explore thousands of games
        </p>
        
        <div className={styles.floatingControls}>
          <div className={styles.controlsContent}>
            <div className={styles.filterSearchContainer}>
              <button 
                className={`${styles.filterButton} ${isFilterOpen ? styles.active : ''} ${activeFiltersCount > 0 ? styles.hasFilters : ''}`}
                onClick={toggleFilter}
                aria-label="Toggle filters"
              >
                <Filter size={18} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className={styles.filterCount}>{activeFiltersCount}</span>
                )}
              </button>
              
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder={isMobile ? "Search games..." : "Search games by name..."}
                  defaultValue={filters.searchQuery}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                />
                <button className={styles.searchButton} aria-label="Search">
                  <Search size={18} />
                </button>
              </div>
              
              {!isMobile && (
                <div className={styles.viewToggle}>
                  <button 
                    className={`${styles.viewToggleButton} ${viewMode === 'grid' ? styles.active : ''}`}
                    onClick={() => toggleViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid size={16} />
                    <span>Grid</span>
                  </button>
                  <button 
                    className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles.active : ''}`}
                    onClick={() => toggleViewMode('list')}
                    aria-label="List view"
                  >
                    <List size={16} />
                    <span>List</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.filterChips}>
              {FILTER_CHIPS.map((chip, index) => (
                <button
                  key={index}
                  className={`${styles.filterChip} ${selectedChip === index ? styles.active : ''}`}
                  onClick={() => handleChipSelect(index)}
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main content - games grid or list */}
        {loading && games.length === 0 ? (
          <div className={styles.skeletonGrid}>
            {renderSkeletons()}
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : games.length === 0 ? (
          <div className={styles.noResults}>
            <Search className={styles.noResultsIcon} />
            <h2 className={styles.noResultsTitle}>No games found</h2>
            <p className={styles.noResultsMessage}>
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
            <button className={styles.resetFiltersButton} onClick={resetFilters}>
              <RefreshCw size={16} />
              Reset all filters
            </button>
          </div>
        ) : (
          <>
            {(viewMode === 'grid' || isMobile) ? (
              <div className={styles.gameGrid}>
                {games.map(game => (
                  <div 
                    key={game.id} 
                    className={styles.gameGridCard}
                    onClick={() => handleGameClick(game.id)}
                  >
                    <div className={styles.gameImageContainer}>
                      <img 
                        src={game.cover} 
                        alt={game.name} 
                        className={styles.gameImage}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.gameInfo}>
                      <h3 className={styles.gameTitle}>{game.name}</h3>
                      {game.genres && (
                        <p className={styles.gameGenres}>{game.genres}</p>
                      )}
                      {/* Remove the gameMeta div and rating display */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.gameList}>
                {games.map((game, idx) => (
                  <div 
                    key={`${game.id}-${idx}`} 
                    className={styles.gameListItem}
                    onClick={() => handleGameClick(game.id)}
                  >
                    <img 
                      src={game.cover} 
                      alt={game.name} 
                      className={styles.gameListImage}
                      loading="lazy"
                    />
                    <div className={styles.gameListInfo}>
                      <h3 className={styles.gameListTitle}>{game.name}</h3>
                      <div className={styles.gameListMeta}>
                        <div className={styles.gameGenres}>{game.genres}</div>
                        {game.rating > 0 && (
                          <div className={styles.gameRating}>
                            <Star size={14} fill="#6c5ce7" color="#6c5ce7" />
                            {game.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Infinite scroll loading reference */}
            <div ref={loadingRef} className={styles.loadMore}>
              {loading && hasMore && (
                <>
                  <div className={styles.loadMoreSpinner}></div>
                  <p>Loading more games...</p>
                </>
              )}
            </div>
          </>
        )}
        
        {/* Filter panel */}
        <div className={`${styles.filterOverlay} ${isFilterOpen ? styles.open : ''}`}>
          <div className={styles.filterPanel}>
            <div className={styles.filterHeader}>
              <h2>Filter Games</h2>
              <button className={styles.closeButton} onClick={toggleFilter}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.filterContent}>
              <div className={styles.filterSection}>
                <h3>Platform</h3>
                <select
                  value={tempFilters.platforms.length > 0 ? tempFilters.platforms[0].toString() : ''}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    platforms: e.target.value === '' ? [] : [Number(e.target.value)]
                  }))}
                  className={styles.filterSelect}
                >
                  <option value="">All Platforms</option>
                  {PLATFORMS.map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterSection}>
                <h3>Genre</h3>
                <select
                  value={tempFilters.genres.length > 0 ? tempFilters.genres[0].toString() : ''}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    genres: e.target.value === '' ? [] : [Number(e.target.value)]
                  }))}
                  className={styles.filterSelect}
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterSection}>
                <h3>Release Year</h3>
                <select
                  value={tempFilters.releaseYear === null ? '' : tempFilters.releaseYear}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    releaseYear: e.target.value === '' ? null : Number(e.target.value)
                  }))}
                  className={styles.filterSelect}
                >
                  <option value="">All Years</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterSection}>
                <h3>Release Status</h3>
                <select
                  value={tempFilters.releaseStatus}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    releaseStatus: e.target.value as 'all' | 'released' | 'upcoming'
                  }))}
                  className={styles.filterSelect}
                >
                  {RELEASE_STATUS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterSection}>
                <h3>Sort By</h3>
                <select
                  value={tempFilters.sort}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    sort: e.target.value
                  }))}
                  className={styles.filterSelect}
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={styles.filterActions}>
              <button className={styles.resetButton} onClick={resetFilters}>
                <RefreshCw size={16} />
                Reset Filters
              </button>
              <button className={styles.applyButton} onClick={applyFilters}>
                <Check size={16} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Back to top button - MUST BE INSIDE main but OUTSIDE other elements */}
        <button 
          className={`${styles.backToTop} ${showBackToTop ? styles.visible : ''}`}
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ChevronUp size={20} />
        </button>
      </main>
    </div>
  );
}
