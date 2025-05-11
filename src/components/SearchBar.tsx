'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';
import styles from '../styles/SearchBar.module.css';

interface SearchResult {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add event listener to close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    const searchGames = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching games:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const delayDebounce = setTimeout(() => {
      searchGames();
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [query]);
  
  const handleResultClick = (gameId: number) => {
    router.push(`/games/${gameId}`);
    setShowResults(false);
    setQuery('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleResultClick(results[0].id);
    }
  };
  
  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Search games..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          {isLoading ? (
            <div className={styles.loadingIndicator}>
              <span className={styles.loadingDot}></span>
              <span className={styles.loadingDot}></span>
              <span className={styles.loadingDot}></span>
            </div>
          ) : (
            <FiSearch />
          )}
        </button>
      </form>
      
      {showResults && results.length > 0 && (
        <div className={styles.resultsDropdown}>
          {results.map((game) => (
            <div
              key={game.id}
              className={styles.resultItem}
              onClick={() => handleResultClick(game.id)}
            >
              <img src={game.cover} alt={game.name} className={styles.resultItemImage} />
              <div className={styles.resultItemInfo}>
                <div className={styles.resultItemName}>{game.name}</div>
                {game.genres && <div className={styles.resultItemGenre}>{game.genres}</div>}
              </div>
              <div className={styles.resultItemRating}>★ {game.rating.toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
