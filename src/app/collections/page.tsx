'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { getUserCollection, getUserCollectionStats, CollectionItem } from '@/services/collectionService';
import { FiList, FiPlay, FiClock, FiAward, FiX, FiHeart, FiSearch } from 'react-icons/fi';
import { DocumentSnapshot } from 'firebase/firestore';
import styles from './collections.module.css';

export default function CollectionsPage() {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [games, setGames] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    playing: 0,
    toPlay: 0,
    abandoned: 0,
    wishlist: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Load collection stats and games on page load or when user changes
  useEffect(() => {
    if (user) {
      loadStats();
      loadGames(true);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Load games when active status changes
  useEffect(() => {
    if (user) {
      loadGames(true);
    }
  }, [activeStatus]);

  // Load collection statistics
  const loadStats = async () => {
    if (!user) return;
    
    try {
      const result = await getUserCollectionStats(user.uid);
      if (result.error) {
        console.error('Error loading stats:', result.error);
      } else {
        setStats(result);
      }
    } catch (error) {
      console.error('Error loading collection stats:', error);
    }
  };

  // Load collection games with status filter
  const loadGames = async (reset = false) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserCollection(
        user.uid,
        activeStatus || undefined,
        12, // Number of games per page
        reset ? undefined : lastDoc
      );
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (reset) {
        setGames(result.items);
      } else {
        setGames(prev => [...prev, ...result.items]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error: any) {
      setError(error.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab clicks
  const handleTabClick = (status: string | null) => {
    setActiveStatus(status);
    // Reset pagination
    setLastDoc(undefined);
  };

  // Load more games
  const handleLoadMore = () => {
    loadGames(false);
  };

  // Navigate to game details
  const navigateToGame = (gameId: number) => {
    // Définir le flag pour indiquer que l'utilisateur vient de la page collection
    sessionStorage.setItem('cameFromCollection', 'true');
    // Supprimer les autres flags de navigation potentiellement présents
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromHome');
    sessionStorage.removeItem('cameFromProfile');
    
    router.push(`/games/${gameId}`);
  };

  // Format the date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filtered games based on search query
  const filteredGames = searchQuery.trim() !== ''
    ? games.filter(game => 
        game.gameName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : games;

  // If user is not logged in, show sign in prompt
  if (!user) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.notLoggedIn}>
          <h2>Sign in to view your collection</h2>
          <p>Create an account to keep track of games you are playing, completed, or want to play</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      
      <main className={styles.main}>
        <h1 className={styles.title}>Your Game Collection</h1>
        
        <div className={styles.statsBar}>
          <div 
            className={`${styles.statItem} ${activeStatus === null ? styles.activeStatItem : ''}`}
            onClick={() => handleTabClick(null)}
          >
            <FiList className={styles.statIcon} />
            <div className={styles.statName}>All Games</div>
            <div className={styles.statCount}>{stats.total}</div>
          </div>
          
          <div 
            className={`${styles.statItem} ${activeStatus === 'playing' ? styles.activeStatItem : ''}`}
            onClick={() => handleTabClick('playing')}
          >
            <FiPlay className={styles.statIcon} />
            <div className={styles.statName}>Playing</div>
            <div className={styles.statCount}>{stats.playing}</div>
          </div>
          
          <div 
            className={`${styles.statItem} ${activeStatus === 'completed' ? styles.activeStatItem : ''}`}
            onClick={() => handleTabClick('completed')}
          >
            <FiAward className={styles.statIcon} />
            <div className={styles.statName}>Completed</div>
            <div className={styles.statCount}>{stats.completed}</div>
          </div>
          
          <div 
            className={`${styles.statItem} ${activeStatus === 'toPlay' ? styles.activeStatItem : ''}`}
            onClick={() => handleTabClick('toPlay')}
          >
            <FiClock className={styles.statIcon} />
            <div className={styles.statName}>Plan to Play</div>
            <div className={styles.statCount}>{stats.toPlay}</div>
          </div>
          
          <div 
            className={`${styles.statItem} ${activeStatus === 'abandoned' ? styles.activeStatItem : ''}`}
            onClick={() => handleTabClick('abandoned')}
          >
            <FiX className={styles.statIcon} />
            <div className={styles.statName}>Abandoned</div>
            <div className={styles.statCount}>{stats.abandoned}</div>
          </div>
          
          <div 
            className={`${styles.statItem} ${activeStatus === 'wishlist' ? styles.activeStatItem : ''}`}
            onClick={() => handleTabClick('wishlist')}
          >
            <FiHeart className={styles.statIcon} />
            <div className={styles.statName}>Wishlist</div>
            <div className={styles.statCount}>{stats.wishlist}</div>
          </div>
        </div>
        
        {stats.total > 0 && (
          <div className={styles.searchBar}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search in your collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        )}
        
        {loading && games.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading your collection...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>{error}</div>
        ) : stats.total === 0 ? (
          <div className={styles.emptyCollection}>
            <h3>Your collection is empty</h3>
            <p>Add games to your collection from any game page</p>
            <button 
              className={styles.browseButton}
              onClick={() => router.push('/games')}
            >
              Browse Games
            </button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className={styles.emptyCollection}>
            <h3>No games found</h3>
            <p>
              {searchQuery.trim() !== ''
                ? `No games matching "${searchQuery}" in your collection`
                : `No games in the "${activeStatus}" category`}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.collectionGrid}>
              {filteredGames.map(game => (
                <div 
                  key={game.id} 
                  className={styles.gameCard}
                  onClick={() => navigateToGame(game.gameId)}
                >
                  <div className={styles.gameCardImage}>
                    <img src={game.gameCover} alt={game.gameName} />
                    <div className={styles.gameStatus}>
                      {game.status === 'playing' && <FiPlay />}
                      {game.status === 'completed' && <FiAward />}
                      {game.status === 'toPlay' && <FiClock />}
                      {game.status === 'abandoned' && <FiX />}
                      {game.status === 'wishlist' && <FiHeart />}
                    </div>
                  </div>
                  <div className={styles.gameCardContent}>
                    <h3 className={styles.gameCardTitle}>{game.gameName}</h3>
                    <div className={styles.gameCardMeta}>
                      <span className={styles.gameCardDate}>
                        Added {formatDate(game.addedAt)}
                      </span>
                      {game.rating && (
                        <span className={styles.gameCardRating}>
                          {game.rating}/5
                        </span>
                      )}
                    </div>
                    {game.notes && (
                      <p className={styles.gameCardNotes}>{game.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && !loading && (
              <div className={styles.loadMoreContainer}>
                <button 
                  className={styles.loadMoreButton}
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Games'}
                </button>
              </div>
            )}
            
            {loading && games.length > 0 && (
              <div className={styles.loadingMoreContainer}>
                <div className={styles.spinner}></div>
                <p>Loading more games...</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
