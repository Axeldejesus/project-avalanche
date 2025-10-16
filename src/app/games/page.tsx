'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { 
  ArrowLeft, ArrowRight, GamepadIcon, Filter, X, Search, Grid, List, 
  Star, Calendar, ArrowUp, RefreshCw, Check, ChevronUp, Tag, Package, Clock,
  ChevronDown, ChevronRight, Sliders
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
  const [scrollRestored, setScrollRestored] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number | null>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    platforms: false,
    genres: false,
    year: false,
    status: false,
    sort: false
  });
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
    // Remove search query from count
    // if (filters.searchQuery.trim() !== '') count++;
    if (filters.releaseStatus !== 'all') count++;
    // Don't count sort anymore
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
    // Save current scroll position
    sessionStorage.setItem('gamesScrollPosition', window.scrollY.toString());
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

  // Toggle section in filter sidebar
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Apply filters immediately when changed (auto-apply)
  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    setFilters(newFilters);
    setTempFilters(newFilters);
    sessionStorage.setItem('gameFilters', JSON.stringify(newFilters));
    setSelectedChip(null); // Deselect chip when manual filter applied
  };

  // Reset specific filter section
  const resetFilterSection = (section: string) => {
    let updatedFilters = { ...filters };
    
    switch(section) {
      case 'platforms':
        updatedFilters.platforms = [];
        break;
      case 'genres':
        updatedFilters.genres = [];
        break;
      case 'year':
        updatedFilters.releaseYear = null;
        break;
      case 'status':
        updatedFilters.releaseStatus = 'all';
        break;
      // Remove sort case
    }
    
    setFilters(updatedFilters);
    setTempFilters(updatedFilters);
    sessionStorage.setItem('gameFilters', JSON.stringify(updatedFilters));
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
    
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    sessionStorage.setItem('gameFilters', JSON.stringify(defaultFilters));
    setSelectedChip(0);
    setIsFilterOpen(false);
  };

  // Apply the temp filters
  const applyFilters = () => {
    setFilters(tempFilters);
    sessionStorage.setItem('gameFilters', JSON.stringify(tempFilters));
    setIsFilterOpen(false);
    setSelectedChip(null);
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
    setFilters(prev => ({
      ...prev,
      searchQuery: value
    }));
    sessionStorage.setItem('gameFilters', JSON.stringify({
      ...filters,
      searchQuery: value
    }));
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
      platforms: [],
      genres: [],
      releaseYear: null,
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

  // SIMPLIFIED: Restore scroll immediately when games are loaded
  useEffect(() => {
    if (!scrollRestored && games.length > 0 && !loading) {
      const savedScrollPosition = sessionStorage.getItem('gamesScrollPosition');
      if (savedScrollPosition) {
        const position = parseInt(savedScrollPosition);
        console.log('Restoring scroll to:', position);
        
        // Immediate scroll - no delay
        window.scrollTo({
          top: position,
          behavior: 'instant' as ScrollBehavior
        });
        
        // Verify and retry if needed
        setTimeout(() => {
          const currentPos = window.scrollY;
          console.log('Current position:', currentPos);
          
          if (Math.abs(currentPos - position) > 50) {
            console.log('Retrying scroll...');
            window.scrollTo({
              top: position,
              behavior: 'instant' as ScrollBehavior
            });
          }
          
          sessionStorage.removeItem('gamesScrollPosition');
          setScrollRestored(true);
        }, 100);
      } else {
        setScrollRestored(true);
      }
    }
  }, [games.length, loading, scrollRestored]);

  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Game Library</h1>
            <p className={styles.subtitle}>
              <GamepadIcon size={18} />
              Discover and explore thousands of games
            </p>
          </div>
          
          {/* Desktop: Show active filters count */}
          {!isMobile && activeFiltersCount > 0 && (
            <button className={styles.clearAllFilters} onClick={resetFilters}>
              <RefreshCw size={16} />
              Clear all filters ({activeFiltersCount})
            </button>
          )}
        </div>
        
        <div className={styles.contentLayout}>
          {/* Desktop Sidebar Filters */}
          {!isMobile && (
            <aside className={styles.filterSidebar}>
              <div className={styles.sidebarHeader}>
                <div className={styles.sidebarTitle}>
                  <Sliders size={18} />
                  Filters
                </div>
                {activeFiltersCount > 0 && (
                  <button className={styles.sidebarReset} onClick={resetFilters}>
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
              
              {/* Search in sidebar */}
              <div className={styles.sidebarSection}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={filters.searchQuery}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                  />
                  <Search size={16} className={styles.searchIcon} />
                </div>
              </div>
              
              {/* Platform Filter */}
              <div className={styles.sidebarSection}>
                <button 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('platforms')}
                >
                  <span>Platform</span>
                  <div className={styles.sectionHeaderRight}>
                    {filters.platforms.length > 0 && (
                      <span className={styles.sectionCount}>{filters.platforms.length}</span>
                    )}
                    {expandedSections.platforms ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
                {expandedSections.platforms && (
                  <div className={styles.sectionContent}>
                    {PLATFORMS.map(platform => (
                      <label key={platform.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={filters.platforms.includes(platform.id)}
                          onChange={(e) => {
                            const newPlatforms = e.target.checked
                              ? [...filters.platforms, platform.id]
                              : filters.platforms.filter(p => p !== platform.id);
                            handleFilterChange('platforms', newPlatforms);
                          }}
                        />
                        <span>{platform.name}</span>
                      </label>
                    ))}
                    {filters.platforms.length > 0 && (
                      <button 
                        className={styles.sectionReset}
                        onClick={() => resetFilterSection('platforms')}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Genre Filter */}
              <div className={styles.sidebarSection}>
                <button 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('genres')}
                >
                  <span>Genre</span>
                  <div className={styles.sectionHeaderRight}>
                    {filters.genres.length > 0 && (
                      <span className={styles.sectionCount}>{filters.genres.length}</span>
                    )}
                    {expandedSections.genres ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
                {expandedSections.genres && (
                  <div className={styles.sectionContent}>
                    {genres.map(genre => (
                      <label key={genre.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={filters.genres.includes(genre.id)}
                          onChange={(e) => {
                            const newGenres = e.target.checked
                              ? [...filters.genres, genre.id]
                              : filters.genres.filter(g => g !== genre.id);
                            handleFilterChange('genres', newGenres);
                          }}
                        />
                        <span>{genre.name}</span>
                      </label>
                    ))}
                    {filters.genres.length > 0 && (
                      <button 
                        className={styles.sectionReset}
                        onClick={() => resetFilterSection('genres')}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Release Year Filter */}
              <div className={styles.sidebarSection}>
                <button 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('year')}
                >
                  <span>Release Year</span>
                  <div className={styles.sectionHeaderRight}>
                    {filters.releaseYear && (
                      <span className={styles.sectionBadge}>{filters.releaseYear}</span>
                    )}
                    {expandedSections.year ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
                {expandedSections.year && (
                  <div className={styles.sectionContent}>
                    <select
                      value={filters.releaseYear === null ? '' : filters.releaseYear}
                      onChange={(e) => handleFilterChange('releaseYear', e.target.value === '' ? null : Number(e.target.value))}
                      className={styles.filterSelect}
                    >
                      <option value="">All Years</option>
                      {YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {filters.releaseYear !== null && (
                      <button 
                        className={styles.sectionReset}
                        onClick={() => resetFilterSection('year')}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Release Status Filter */}
              <div className={styles.sidebarSection}>
                <button 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('status')}
                >
                  <span>Release Status</span>
                  <div className={styles.sectionHeaderRight}>
                    {filters.releaseStatus !== 'all' && (
                      <span className={styles.sectionBadge}>
                        {RELEASE_STATUS.find(s => s.value === filters.releaseStatus)?.label}
                      </span>
                    )}
                    {expandedSections.status ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
                {expandedSections.status && (
                  <div className={styles.sectionContent}>
                    {RELEASE_STATUS.map(status => (
                      <label key={status.value} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="releaseStatus"
                          checked={filters.releaseStatus === status.value}
                          onChange={() => handleFilterChange('releaseStatus', status.value as 'all' | 'released' | 'upcoming')}
                        />
                        <span>{status.label}</span>
                      </label>
                    ))}
                    {filters.releaseStatus !== 'all' && (
                      <button 
                        className={styles.sectionReset}
                        onClick={() => resetFilterSection('status')}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Remove Sort Filter section completely */}
            </aside>
          )}
          
          {/* Main Content Area */}
          <div className={styles.mainContent}>
            {/* Mobile Controls */}
            {isMobile && (
              <div className={styles.mobileControls}>
                <div className={styles.mobileTopBar}>
                  <button 
                    className={`${styles.filterButton} ${activeFiltersCount > 0 ? styles.hasFilters : ''}`}
                    onClick={toggleFilter}
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
                      placeholder="Search games..."
                      value={filters.searchQuery}
                      onChange={handleSearchChange}
                      className={styles.searchInput}
                    />
                    <Search size={18} className={styles.searchIcon} />
                  </div>
                </div>
                
                {/* Remove filter chips completely on mobile */}
              </div>
            )}
            
            {/* Games Grid/List */}
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
                            loading="eager"
                          />
                        </div>
                        <div className={styles.gameInfo}>
                          <h3 className={styles.gameTitle}>{game.name}</h3>
                          {game.genres && (
                            <p className={styles.gameGenres}>{game.genres}</p>
                          )}
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
          </div>
        </div>
        
        {/* Mobile Bottom Sheet Filter */}
        {isMobile && (
          <>
            <div 
              className={`${styles.filterOverlay} ${isFilterOpen ? styles.open : ''}`}
              onClick={toggleFilter}
            />
            <div className={`${styles.mobileFilterSheet} ${isFilterOpen ? styles.open : ''}`}>
              <div className={styles.filterSheetHandle} />
              <div className={styles.filterSheetHeader}>
                <h2>Filters</h2>
                <button onClick={toggleFilter} className={styles.closeButton}>
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.filterSheetContent}>
                {/* Platform */}
                <div className={styles.filterSheetSection}>
                  <h3>Platform</h3>
                  <div className={styles.checkboxGrid}>
                    {PLATFORMS.map(platform => (
                      <label key={platform.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={tempFilters.platforms.includes(platform.id)}
                          onChange={(e) => {
                            const newPlatforms = e.target.checked
                              ? [...tempFilters.platforms, platform.id]
                              : tempFilters.platforms.filter(p => p !== platform.id);
                            setTempFilters(prev => ({ ...prev, platforms: newPlatforms }));
                          }}
                        />
                        <span>{platform.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Genre */}
                <div className={styles.filterSheetSection}>
                  <h3>Genre</h3>
                  <div className={styles.checkboxGrid}>
                    {genres.map(genre => (
                      <label key={genre.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={tempFilters.genres.includes(genre.id)}
                          onChange={(e) => {
                            const newGenres = e.target.checked
                              ? [...tempFilters.genres, genre.id]
                              : tempFilters.genres.filter(g => g !== genre.id);
                            setTempFilters(prev => ({ ...prev, genres: newGenres }));
                          }}
                        />
                        <span>{genre.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Year & Status */}
                <div className={styles.filterSheetSection}>
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
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.filterSheetSection}>
                  <h3>Release Status</h3>
                  <div className={styles.radioGroup}>
                    {RELEASE_STATUS.map(status => (
                      <label key={status.value} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="tempReleaseStatus"
                          checked={tempFilters.releaseStatus === status.value}
                          onChange={() => setTempFilters(prev => ({
                            ...prev,
                            releaseStatus: status.value as 'all' | 'released' | 'upcoming'
                          }))}
                        />
                        <span>{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Remove Sort By section */}
              </div>
              
              <div className={styles.filterSheetActions}>
                <button className={styles.resetButton} onClick={resetFilters}>
                  <RefreshCw size={16} />
                  Reset
                </button>
                <button className={styles.applyButton} onClick={applyFilters}>
                  <Check size={16} />
                  Apply Filters
                </button>
              </div>
            </div>
          </>
        )}
        
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
