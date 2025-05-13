'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './games.module.css';

interface Game {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5); // Will be updated when we have total count

  useEffect(() => {
    fetchGames();
  }, [page]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/games?page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data.games);
      // If backend provides total count, we can calculate total pages
      // setTotalPages(Math.ceil(data.totalCount / 20));
    } catch (err) {
      setError('Error loading games. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        <h1 className={styles.title}>Game Library</h1>
        
        <div className={styles.pagination}>
          <button 
            onClick={handlePrevPage} 
            disabled={page === 1}
            className={styles.paginationButton}
          >
            <ChevronLeft size={20} /> Prev
          </button>
          <span className={styles.pageIndicator}>Page {page} of {totalPages}</span>
          <button 
            onClick={handleNextPage} 
            disabled={page === totalPages}
            className={styles.paginationButton}
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading games...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.gameGrid}>
            {games.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
            {games.length === 0 && (
              <div className={styles.noGames}>No games found</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
