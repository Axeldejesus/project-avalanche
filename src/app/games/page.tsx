'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { ArrowLeft, ArrowRight, GamepadIcon, Filter, X, Search } from 'lucide-react';
import styles from './games.module.css';

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
  releaseYear: number | null; // Remplace yearStart et yearEnd par une seule année
  searchQuery: string;
}

// Options de filtre constantes
const PLATFORMS = [
  { id: 167, name: 'PlayStation 5' },
  { id: 169, name: 'Xbox Series X' },
  { id: 130, name: 'Nintendo Switch' },
  { id: 6, name: 'PC' },
  { id: 48, name: 'PlayStation 4' },
  { id: 49, name: 'Xbox One' },
];

// Générer les années pour les menus déroulants
const YEARS = Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i);

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(100);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    platforms: [],
    genres: [],
    releaseYear: null, // Utiliser null pour indiquer "Toutes les années"
    searchQuery: ''
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [genres, setGenres] = useState<{ id: number, name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchGames();
  }, [page, filters]);

  useEffect(() => {
    // Calculer le nombre de filtres actifs
    let count = 0;
    if (filters.platforms.length > 0) count++;
    if (filters.genres.length > 0) count++;
    if (filters.releaseYear !== null) count++; // Compter l'année si elle est définie
    if (filters.searchQuery.trim() !== '') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    // Set a flag to indicate the user is on the games page
    sessionStorage.setItem('cameFromGames', 'true');
    
    return () => {
      // We'll leave this value in sessionStorage in case user navigates to a game detail page
    };
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/genres');
        if (response.ok) {
          const data = await response.json();
          // Filtrer pour obtenir seulement les genres avec des ID et des noms valides
          const validGenres = data.filter((genre: any) => 
            genre && typeof genre.id === 'number' && genre.name && typeof genre.name === 'string'
          );
          console.log('Genres chargés:', validGenres);
          setGenres(validGenres);
        }
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };
    
    fetchGenres();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    try {
      // Construire l'URL avec les paramètres de filtre
      let url = `/api/games?page=${page}`;
      
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

      // Ajouter un log pour voir quels genres sont envoyés
      if (filters.genres.length > 0) {
        console.log("Filtrage par genres (IDs): ", filters.genres);
        console.log("Noms des genres sélectionnés: ", 
          filters.genres.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(', '));
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data.games);
      
      // Si l'API renvoie 0 jeux, c'est qu'on a atteint la fin
      if (data.games.length === 0 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      setError('Error loading games. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleGameClick = (gameId: number) => {
    // Set the flag explicitly before navigation
    sessionStorage.setItem('cameFromGames', 'true');
    router.push(`/games/${gameId}`);
  };

  const toggleFilter = () => {
    setShowFilters(!showFilters);
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
    setFilters(prev => ({
      ...prev,
      platforms: selectedOptions
    }));
    setPage(1);
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
    setFilters(prev => ({
      ...prev,
      genres: selectedOptions
    }));
    setPage(1);
  };

  const handleReleaseYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      releaseYear: value === '' ? null : Number(value)
    }));
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: e.target.value
    }));
    // Ne pas déclencher de recherche à chaque frappe pour éviter les requêtes excessives
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGames();
  };

  const clearFilters = () => {
    setFilters({
      platforms: [],
      genres: [],
      releaseYear: null,
      searchQuery: ''
    });
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        <h1 className={styles.title}>Game Library</h1>
        <p className={styles.subtitle}>
          <GamepadIcon size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Find your game
        </p>
        
        <div className={styles.paginationContainer}>
          <div className={styles.filterSearchContainer}>
            <button 
              onClick={toggleFilter} 
              className={`${styles.filterButton} ${showFilters ? styles.activeFilterButton : ''} ${activeFiltersCount > 0 ? styles.hasActiveFilters : ''}`}
              aria-label="Toggle filters"
            >
              <Filter size={16} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className={styles.filterCount}>{activeFiltersCount}</span>
              )}
            </button>
            
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <div className={styles.searchInputWrapper}>
                <input 
                  type="text" 
                  placeholder="Search by game name..."
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                  <Search size={16} />
                </button>
              </div>
            </form>
          </div>
          
          <div className={styles.pagination}>
            <button 
              onClick={handlePrevPage} 
              disabled={page === 1}
              className={styles.paginationButton}
            >
              <ArrowLeft size={16} /> Prev
            </button>
            <span className={styles.pageIndicator}>{page}</span>
            <button 
              onClick={handleNextPage} 
              disabled={games.length === 0}
              className={styles.paginationButton}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className={styles.filterBox}>
            <div className={styles.filterHeader}>
              <h3>Filter Games</h3>
              <button className={styles.closeFilterButton} onClick={toggleFilter}>
                <X size={18} />
              </button>
            </div>
            
            <div className={styles.filterContent}>
              <div className={styles.filterSection}>
                <h4>Platforms</h4>
                <div className={styles.checkboxGroup}>
                  {PLATFORMS.map(platform => (
                    <label key={platform.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={filters.platforms.includes(platform.id)}
                        onChange={() => {
                          const newPlatforms = filters.platforms.includes(platform.id)
                            ? filters.platforms.filter(id => id !== platform.id)
                            : [...filters.platforms, platform.id];
                          
                          setFilters(prev => ({
                            ...prev,
                            platforms: newPlatforms
                          }));
                          setPage(1);
                        }}
                        className={styles.checkbox}
                      />
                      {platform.name}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className={styles.filterSection}>
                <h4>Genres</h4>
                <div className={styles.checkboxGroup}>
                  {genres.length > 0 ? (
                    genres.map(genre => (
                      <label key={genre.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={filters.genres.includes(genre.id)}
                          onChange={() => {
                            const newGenres = filters.genres.includes(genre.id)
                              ? filters.genres.filter(id => id !== genre.id)
                              : [...filters.genres, genre.id];
                            
                            setFilters(prev => ({
                              ...prev,
                              genres: newGenres
                            }));
                            setPage(1);
                          }}
                          className={styles.checkbox}
                        />
                        {genre.name}
                      </label>
                    ))
                  ) : (
                    <div>Chargement des genres...</div>
                  )}
                </div>
              </div>
              
              <div className={styles.filterSection}>
                <h4>Release Year</h4>
                <select
                  value={filters.releaseYear === null ? '' : filters.releaseYear}
                  onChange={handleReleaseYearChange}
                  className={styles.simpleSelect}
                >
                  <option value="">All Years</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterActions}>
                <button className={styles.clearFiltersButton} onClick={clearFilters}>
                  Clear All Filters
                </button>
                <button className={styles.applyFiltersButton} onClick={() => {
                  setPage(1);
                  fetchGames();
                  toggleFilter();
                }}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className={styles.loading}>Loading games...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.gameGrid}>
            {games.map(game => (
              <div key={game.id} onClick={() => handleGameClick(game.id)}>
                <GameCard game={game} />
              </div>
            ))}
            {games.length === 0 && (
              <div className={styles.noGames}>No games found with the current filters</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
