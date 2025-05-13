'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
  const [totalPages, setTotalPages] = useState(100); // Valeur par défaut élevée pour permettre de parcourir l'API complète
  const router = useRouter();

  useEffect(() => {
    fetchGames();
  }, [page]);

  useEffect(() => {
    // Set a flag to indicate the user is on the games page
    sessionStorage.setItem('cameFromGames', 'true');
    
    return () => {
      // We'll leave this value in sessionStorage in case user navigates to a game detail page
    };
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/games?page=${page}`);
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
            <ArrowLeft size={20} /> Previous
          </button>
          <span className={styles.pageIndicator}>Page {page}</span>
          <button 
            onClick={handleNextPage} 
            disabled={games.length === 0}
            className={styles.paginationButton}
          >
            Next <ArrowRight size={20} />
          </button>
        </div>
        
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
              <div className={styles.noGames}>No games found</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
