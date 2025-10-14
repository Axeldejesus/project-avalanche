'use client';

import { useState, useEffect, useRef, JSX } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { getUserCollection, getUserCollectionStats, removeFromCollection } from '@/services/collectionService';
import { type CollectionItem, type CollectionStats } from '@/schemas';
import { getUserLists, getListsWithCounts, getGamesInList, deleteList, removeGameFromList, createList } from '@/services/listService';
import { type List, type ListGame } from '@/schemas';
import { FiList, FiPlay, FiClock, FiAward, FiX, FiHeart, FiSearch, FiTrash2, FiPlus, FiEdit2, FiTag, FiLayers, FiGrid, FiChevronDown, FiChevronUp, FiFilm, FiBookmark, FiStar, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa';
import { DocumentSnapshot } from 'firebase/firestore';
import { CacheManager } from '@/utils/cacheManager';
import styles from './collections.module.css';

const AVAILABLE_ICONS = [
  { icon: <FaGamepad />, name: 'gamepad' },
  { icon: <FiHeart />, name: 'heart' },
  { icon: <FiStar />, name: 'star' },
  { icon: <FiAward />, name: 'award' },
  { icon: <FiBookmark />, name: 'bookmark' },
  { icon: <FiTag />, name: 'tag' },
  { icon: <FiFilm />, name: 'film' },
  { icon: <FiLayers />, name: 'layers' }
];

// Component for creating a new list
const CreateListForm = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('gamepad');
  const [selectedColor, setSelectedColor] = useState('#7c3aed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Palette de couleurs étendue (sans doublons)
  const colorPalette = [
    '#7c3aed', // Purple
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#10b981', // Green
    '#84cc16', // Lime
    '#eab308', // Yellow
    '#f59e0b', // Amber
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
    '#14b8a6', // Teal
    '#0ea5e9', // Sky
    '#a855f7', // Purple Light
    '#fb923c', // Orange Light
    '#e11d48', // Crimson
    '#059669'  // Emerald
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a list name');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createList({
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor
      });
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to create list');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.createListForm}>
      <h3>Create New List</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>List Name*</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Games to Finish"
            maxLength={50}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this list about?"
            maxLength={200}
            rows={3}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Icon</label>
          <div className={styles.iconSelector}>
            {AVAILABLE_ICONS.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`${styles.iconOption} ${selectedIcon === item.name ? styles.selectedIcon : ''}`}
                onClick={() => setSelectedIcon(item.name)}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>Color</label>
          <div className={styles.colorSelector}>
            {colorPalette.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorOption} ${selectedColor === color ? styles.selectedColor : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create List'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Game list component
const GameList = ({ 
  games, 
  onDeleteGame, 
  viewMode, 
  deletingId, 
  setDeletingId 
}: { 
  games: (CollectionItem | ListGame)[], 
  onDeleteGame: (gameId: number) => void,
  viewMode: 'grid' | 'list',
  deletingId: number | null,
  setDeletingId: (id: number | null) => void
}): JSX.Element => {
  const router = useRouter();
  
  const handleDeleteGame = async (gameId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(gameId);
    await onDeleteGame(gameId);
    setDeletingId(null);
  };
  
  const navigateToGame = (gameId: number) => {
    sessionStorage.setItem('cameFromCollection', 'true');
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromHome');
    sessionStorage.removeItem('cameFromProfile');
    router.push(`/games/${gameId}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatusIcon = (game: any) => {
    if ('status' in game) {
      const status = game.status;
      if (status === 'playing') return <FiPlay />;
      if (status === 'completed') return <FiAward />;
      if (status === 'toPlay') return <FiClock />;
      if (status === 'abandoned') return <FiX />;
      if (status === 'wishlist') return <FiHeart />;
    }
    return <FaGamepad />;
  };
  
  const getAddedDate = (game: any) => {
    if ('addedAt' in game) return game.addedAt;
    return game.addedAt || game.updatedAt;
  };
  
  return (
    <div className={viewMode === 'grid' ? styles.collectionGrid : styles.collectionList}>
      {games.map((game, idx) => {
        const gameId = game.gameId;
        const gameName = game.gameName;
        const gameCover = game.gameCover;
        
        return (
          <div 
            key={`${gameId}-${idx}`} 
            className={viewMode === 'grid' ? styles.gameCard : styles.gameListItem}
            onClick={() => navigateToGame(gameId)}
          >
            <div className={viewMode === 'grid' ? styles.gameCardImage : styles.gameListImage}>
              <img src={gameCover} alt={gameName} />
              <div className={styles.gameStatus}>
                {getStatusIcon(game)}
              </div>
              <button 
                className={styles.deleteButton}
                onClick={(e) => handleDeleteGame(gameId, e)}
                disabled={deletingId === gameId}
                aria-label="Remove game"
              >
                {deletingId === gameId ? (
                  <span className={styles.smallSpinner}></span>
                ) : (
                  <FiTrash2 />
                )}
              </button>
            </div>
            <div className={viewMode === 'grid' ? styles.gameCardContent : styles.gameListContent}>
              <h3 className={viewMode === 'grid' ? styles.gameCardTitle : styles.gameListTitle}>
                {gameName}
              </h3>
              <div className={viewMode === 'grid' ? styles.gameCardMeta : styles.gameListMeta}>
                <span className={styles.gameCardDate}>
                  Added {formatDate(getAddedDate(game))}
                </span>
                {'rating' in game && game.rating && (
                  <span className={styles.gameCardRating}>
                    {game.rating}/5
                  </span>
                )}
              </div>
              {'notes' in game && game.notes && (
                <p className={styles.gameNotes}>{game.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function CollectionsPage() {
  // State for collection and UI
  const [activeTab, setActiveTab] = useState<'collection' | 'lists'>('collection');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [collectionGames, setCollectionGames] = useState<CollectionItem[]>([]);
  const [listGames, setListGames] = useState<ListGame[]>([]);
  const [customLists, setCustomLists] = useState<Array<List & { gameCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Ajouter un cache avec timestamp
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
  
  // Collection stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    playing: 0,
    toPlay: 0,
    abandoned: 0,
    wishlist: 0
  });
  
  // Pagination state
  const [collectionLastDoc, setCollectionLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [listLastDoc, setListLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMoreCollection, setHasMoreCollection] = useState(false);
  const [hasMoreListGames, setHasMoreListGames] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  
  // Load collection and lists data
  useEffect(() => {
    setAuthLoading(true);
    
    const authTimeout = setTimeout(() => {
      setAuthChecked(true);
      setAuthLoading(false);
    }, 1500);
    
    if (user) {
      clearTimeout(authTimeout);
      setAuthChecked(true);
      setAuthLoading(false);
      
      // Utiliser le CacheManager
      const cachedData = CacheManager.get<{
        stats: CollectionStats;
        lists: Array<List & { gameCount: number }>;
        games: CollectionItem[];
        hasMoreCollection: boolean;
        activeStatus?: string | null;
      }>(`collection_${user.uid}`);
      
      if (cachedData) {
        setStats(cachedData.stats);
        setCustomLists(cachedData.lists);
        setCollectionGames(cachedData.games);
        setHasMoreCollection(cachedData.hasMoreCollection || false);
        // Restaurer aussi le statut actif si présent
        if (cachedData.activeStatus !== undefined) {
          setActiveStatus(cachedData.activeStatus);
        }
        setLoading(false);
        console.log('Using cached collection data', { hasMore: cachedData.hasMoreCollection });
        return; // Important : ne pas charger les données si on a le cache
      }
      
      // Seulement charger si pas de cache
      loadAllData();
    }
    
    return () => clearTimeout(authTimeout);
  }, [user]);
  
  // Load collection games when active status changes
  useEffect(() => {
    // Ne charger que si les données ne viennent pas du cache
    if (user && activeTab === 'collection' && collectionGames.length === 0) {
      loadCollectionGames(true);
    }
  }, [activeStatus, activeTab]);
  
  // Load list games when active list changes
  useEffect(() => {
    if (user && activeTab === 'lists' && activeListId) {
      loadListGames(true);
    }
  }, [activeListId, activeTab]);
  
  // Collection stats
  const loadCollectionStats = async () => {
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
  
  // Load custom lists
  const loadCustomLists = async () => {
    if (!user) return;
    
    try {
      const result = await getListsWithCounts(user.uid);
      if (result.error) {
        console.error('Error loading lists:', result.error);
      } else {
        setCustomLists(result.lists);
      }
    } catch (error) {
      console.error('Error loading custom lists:', error);
    }
  };
  
  // Load collection games
  const loadCollectionGames = async (reset = false) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserCollection(
        user.uid,
        activeStatus || undefined,
        12, // Number of games per page
        reset ? undefined : collectionLastDoc
      );
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (reset) {
        setCollectionGames(result.items);
      } else {
        setCollectionGames(prev => [...prev, ...result.items]);
      }
      
      setCollectionLastDoc(result.lastDoc);
      setHasMoreCollection(result.hasMore);
    } catch (error: any) {
      setError(error.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };
  
  // Load games from a custom list
  const loadListGames = async (reset = false) => {
    if (!user || !activeListId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getGamesInList(
        user.uid,
        activeListId,
        12, // Number of games per page
        reset ? undefined : listLastDoc
      );
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (reset) {
        setListGames(result.games);
      } else {
        setListGames(prev => [...prev, ...result.games]);
      }
      
      setListLastDoc(result.lastDoc);
      setHasMoreListGames(result.hasMore);
    } catch (error: any) {
      setError(error.message || 'Failed to load list games');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab clicks
  const handleTabClick = (tab: 'collection' | 'lists') => {
    setActiveTab(tab);
    if (tab === 'collection') {
      setActiveListId(null);
      loadCollectionGames(true);
    } else if (tab === 'lists' && customLists.length > 0 && !activeListId) {
      // Select first list by default if none is selected
      setActiveListId(customLists[0].id || null);
      loadListGames(true);
    }
  };
  
  // Handle collection status filter clicks
  const handleStatusClick = (status: string | null) => {
    setActiveStatus(status);
    // Reset pagination et vider les jeux pour forcer le rechargement
    setCollectionLastDoc(undefined);
    setCollectionGames([]);
    setHasMoreCollection(false);
    // Invalider le cache car le filtre a changé
    if (user) {
      CacheManager.remove(`collection_${user.uid}`);
    }
  };
  
  // Handle list selection
  const handleListClick = (listId: string | null) => {
    if (listId === activeListId) return;
    
    setActiveListId(listId);
    setListLastDoc(undefined);
    setListGames([]);
  };
  
  // Load more games
  const handleLoadMore = () => {
    if (activeTab === 'collection') {
      loadCollectionGames(false);
    } else if (activeTab === 'lists' && activeListId) {
      loadListGames(false);
    }
  };
  
  // Nouvelle fonction pour charger toutes les données et les mettre en cache
  const loadAllData = async () => {
    setLoading(true);
    
    try {
      const [statsResult, listsResult, gamesResult] = await Promise.all([
        user ? getUserCollectionStats(user.uid) : Promise.resolve(null),
        user ? getListsWithCounts(user.uid) : Promise.resolve(null),
        user ? getUserCollection(user.uid, activeStatus || undefined, 12) : Promise.resolve(null)
      ]);
      
      if (statsResult && !statsResult.error) {
        setStats(statsResult);
      }
      
      if (listsResult && !listsResult.error) {
        setCustomLists(listsResult.lists);
      }
      
      if (gamesResult && !gamesResult.error) {
        setCollectionGames(gamesResult.items);
        setCollectionLastDoc(gamesResult.lastDoc);
        setHasMoreCollection(gamesResult.hasMore);
      }
      
      // Utiliser CacheManager avec localStorage pour persistance
      if (user) {
        CacheManager.set(
          `collection_${user.uid}`,
          {
            stats: statsResult,
            lists: listsResult?.lists || [],
            games: gamesResult?.items || [],
            hasMoreCollection: gamesResult?.hasMore || false,
            activeStatus: activeStatus
          },
          true // Utiliser aussi localStorage
        );
        console.log('Collection data cached with hasMore:', gamesResult?.hasMore);
      }
      
    } catch (error) {
      console.error('Error loading collection data:', error);
      setError('Failed to load collection data');
    } finally {
      setLoading(false);
    }
  };
  
  // Invalider le cache lors de modifications
  const invalidateCache = () => {
    sessionStorage.removeItem('collectionCache');
    sessionStorage.removeItem('collectionCacheTimestamp');
  };
  
  // Handle game deletion from collection
  const handleDeleteCollectionGame = async (gameId: number) => {
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to remove this game from your collection?`)) {
      setDeletingId(gameId);
      
      try {
        const result = await removeFromCollection(gameId);
        
        if (result.success) {
          setSuccessMessage(`Game removed from your collection!`);
          setCollectionGames(collectionGames.filter(game => game.gameId !== gameId));
          
          // Invalider le cache
          CacheManager.remove(`collection_${user.uid}`);
          CacheManager.invalidatePattern(`statsCache_${user.uid}`);
          loadCollectionStats();
          
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } else {
          setError(result.error || 'Failed to remove game from collection');
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred');
      }
    }
  };
  
  // Handle game deletion from list
  const handleDeleteListGame = async (gameId: number) => {
    if (!user || !activeListId) return;
    
    if (window.confirm(`Are you sure you want to remove this game from this list?`)) {
      try {
        const result = await removeGameFromList(activeListId, gameId);
        
        if (result.success) {
          setSuccessMessage(`Game removed from list!`);
          setListGames(listGames.filter(game => game.gameId !== gameId));
          
          // Invalider le cache
          invalidateCache();
          loadCustomLists();
          
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } else {
          setError(result.error || 'Failed to remove game from list');
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred');
      }
    }
  };
  
  // Delete a custom list
  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to delete this list? All games in the list will be removed from it.`)) {
      try {
        // Déterminer la prochaine liste active AVANT la suppression
        const remainingLists = customLists.filter(list => list.id !== listId);
        
        // Si la liste supprimée est active, changer la liste active AVANT de supprimer
        if (activeListId === listId) {
          if (remainingLists.length > 0) {
            setActiveListId(remainingLists[0].id || null);
            setListGames([]); // Vider les jeux pour éviter d'afficher l'ancienne liste
          } else {
            // Aucune autre liste, passer à la collection
            setActiveTab('collection');
            setActiveListId(null);
            setListGames([]);
          }
        }
        
        // Maintenant supprimer la liste
        const result = await deleteList(listId);
        
        if (result.success) {
          setSuccessMessage(`List deleted successfully!`);
          
          // Recharger les listes
          await loadCustomLists();
          
          // Charger les jeux de la nouvelle liste active si on est toujours dans l'onglet lists
          if (activeTab === 'lists' && activeListId && activeListId !== listId) {
            loadListGames(true);
          }
          
          // Clear success message after a delay
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } else {
          setError(result.error || 'Failed to delete list');
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred');
      }
    }
  };
  
  // Filtered games based on search query
  const filteredCollectionGames = searchQuery.trim() !== ''
    ? collectionGames.filter(game => 
        game.gameName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : collectionGames;
  
  const filteredListGames = searchQuery.trim() !== ''
    ? listGames.filter(game => 
        game.gameName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listGames;
  
  // Handle successful list creation
  const handleListCreated = () => {
    invalidateCache();
    loadCustomLists();
    setSuccessMessage('New list created successfully!');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };
  
  const handleLoginClick = () => {
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };
  
  const handleRegisterClick = () => {
    const event = new CustomEvent('openRegisterModal');
    window.dispatchEvent(event);
  };
  
  // Afficher un spinner de chargement pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Si l'utilisateur n'est pas connecté ET que l'authentification a été vérifiée, afficher le message
  if (authChecked && !user) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.notLoggedIn}>
          <h2>Sign in to view your collection</h2>
          <p>Create an account to keep track of games you are playing, completed, or want to play</p>
          <div className={styles.authActions}>
            <button className={`${styles.authButton} ${styles.loginButton}`} onClick={handleLoginClick}>
              <FiLogIn /> Log In
            </button>
            <button className={`${styles.authButton} ${styles.registerButton}`} onClick={handleRegisterClick}>
              <FiUserPlus /> Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Your Games</h1>
          
          {/* Remove view controls */}
          {/* <div className={styles.viewControls}>
            <button 
              className={styles.viewModeToggle}
              onClick={toggleViewMode}
              title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              {viewMode === 'grid' ? <FiList /> : <FiGrid />}
              <span>{viewMode === 'grid' ? 'List View' : 'Grid View'}</span>
            </button>
          </div> */}
        </div>
        
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'collection' ? styles.activeTab : ''}`}
              onClick={() => handleTabClick('collection')}
            >
              <FiLayers />
              <span>Collection</span>
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'lists' ? styles.activeTab : ''}`}
              onClick={() => handleTabClick('lists')}
            >
              <FiList />
              <span>Custom Lists</span>
            </button>
          </div>
          
          {activeTab === 'lists' && (
            <button 
              className={styles.newListButton}
              onClick={() => setIsCreatingList(true)}
            >
              <FiPlus />
              <span>New List</span>
            </button>
          )}
        </div>
        
        {activeTab === 'collection' && (
          <div className={styles.statsBar}>
            <div 
              className={`${styles.statItem} ${activeStatus === null ? styles.activeStatItem : ''}`}
              onClick={() => handleStatusClick(null)}
            >
              <FiList className={styles.statIcon} />
              <div className={styles.statName}>All Games</div>
              <div className={styles.statCount}>{stats.total}</div>
            </div>
            
            <div 
              className={`${styles.statItem} ${activeStatus === 'playing' ? styles.activeStatItem : ''}`}
              onClick={() => handleStatusClick('playing')}
            >
              <FiPlay className={styles.statIcon} />
              <div className={styles.statName}>Playing</div>
              <div className={styles.statCount}>{stats.playing}</div>
            </div>
            
            <div 
              className={`${styles.statItem} ${activeStatus === 'completed' ? styles.activeStatItem : ''}`}
              onClick={() => handleStatusClick('completed')}
            >
              <FiAward className={styles.statIcon} />
              <div className={styles.statName}>Completed</div>
              <div className={styles.statCount}>{stats.completed}</div>
            </div>
            
            <div 
              className={`${styles.statItem} ${activeStatus === 'toPlay' ? styles.activeStatItem : ''}`}
              onClick={() => handleStatusClick('toPlay')}
            >
              <FiClock className={styles.statIcon} />
              <div className={styles.statName}>Plan to Play</div>
              <div className={styles.statCount}>{stats.toPlay}</div>
            </div>
            
            <div 
              className={`${styles.statItem} ${activeStatus === 'abandoned' ? styles.activeStatItem : ''}`}
              onClick={() => handleStatusClick('abandoned')}
            >
              <FiX className={styles.statIcon} />
              <div className={styles.statName}>Abandoned</div>
              <div className={styles.statCount}>{stats.abandoned}</div>
            </div>
            
            <div 
              className={`${styles.statItem} ${activeStatus === 'wishlist' ? styles.activeStatItem : ''}`}
              onClick={() => handleStatusClick('wishlist')}
            >
              <FiHeart className={styles.statIcon} />
              <div className={styles.statName}>Wishlist</div>
              <div className={styles.statCount}>{stats.wishlist}</div>
            </div>
          </div>
        )}
        
        {activeTab === 'lists' && (
          <div className={styles.listsContainer}>
            <div className={styles.listsSidebar}>
              <h3>Your Lists</h3>
              {customLists.length === 0 ? (
                <div className={styles.noLists}>
                  <p>You haven't created any lists yet</p>
                </div>
              ) : (
                <div className={styles.userLists}>
                  {customLists.map((list, idx) => (
                    <div 
                      key={`${list.id}-${idx}`} 
                      className={`${styles.listItem} ${activeListId === list.id ? styles.activeList : ''}`}
                      onClick={() => handleListClick(list.id || null)}
                    >
                      <div className={styles.listItemIcon} style={{ color: list.color }}>
                        {AVAILABLE_ICONS.find(i => i.name === list.icon)?.icon || <FiList />}
                      </div>
                      <div className={styles.listItemDetails}>
                        <div className={styles.listItemName}>
                          {list.name}
                          <span className={styles.listItemCount}>{list.gameCount}</span>
                        </div>
                      </div>
                      {activeListId === list.id && (
                        <button 
                          className={styles.deleteListButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id || '');
                          }}
                          title="Delete list"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.listsContent}>
              {customLists.length === 0 ? (
                <div className={styles.emptyListsContent}>
                  <h3>Create your first custom list</h3>
                  <p>Organize your games in themed lists like "Games to finish", "Indie gems", or "Classics"</p>
                  <button 
                    className={styles.createListButtonLarge}
                    onClick={() => setIsCreatingList(true)}
                  >
                    <FiPlus /> Create New List
                  </button>
                </div>
              ) : activeListId ? (
                <>
                  {customLists.find(list => list.id === activeListId) && (
                    <div className={styles.listHeader}>
                      <div className={styles.listHeaderDetails}>
                        <h2 className={styles.listHeaderTitle}>
                          <span 
                            className={styles.listHeaderIcon} 
                            style={{ color: customLists.find(list => list.id === activeListId)?.color }}
                          >
                            {AVAILABLE_ICONS.find(i => i.name === customLists.find(list => list.id === activeListId)?.icon)?.icon}
                          </span>
                          {customLists.find(list => list.id === activeListId)?.name}
                        </h2>
                        {customLists.find(list => list.id === activeListId)?.description && (
                          <p className={styles.listHeaderDescription}>
                            {customLists.find(list => list.id === activeListId)?.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {customLists.find(list => list.id === activeListId)?.gameCount === 0 ? (
                    <div className={styles.emptyList}>
                      <p>This list is empty</p>
                      <p>Add games to this list from any game page</p>
                      <button 
                        className={styles.browseButton}
                        onClick={() => router.push('/games')}
                      >
                        Browse Games
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.searchBar}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                          type="text"
                          placeholder="Search in this list..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={styles.searchInput}
                        />
                      </div>
                      
                      {loading && listGames.length === 0 ? (
                        <div className={styles.loadingContainer}>
                          <div className={styles.spinner}></div>
                          <p>Loading games...</p>
                        </div>
                      ) : filteredListGames.length === 0 ? (
                        <div className={styles.emptyCollection}>
                          <h3>No games found</h3>
                          <p>
                            {searchQuery.trim() !== ''
                              ? `No games matching "${searchQuery}" in this list`
                              : `No games in this list`}
                          </p>
                        </div>
                      ) : (
                        <>
                          <GameList 
                            games={filteredListGames} 
                            onDeleteGame={handleDeleteListGame}
                            viewMode="grid"
                            deletingId={deletingId}
                            setDeletingId={setDeletingId}
                          />
                          
                          {hasMoreListGames && !loading && (
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
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className={styles.noListSelected}>
                  <p>Select a list from the sidebar</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'collection' && (
          <>
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
            
            {loading && collectionGames.length === 0 ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading your collection...</p>
              </div>
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
            ) : filteredCollectionGames.length === 0 ? (
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
                <GameList 
                  games={filteredCollectionGames} 
                  onDeleteGame={handleDeleteCollectionGame}
                  viewMode="grid"
                  deletingId={deletingId}
                  setDeletingId={setDeletingId}
                />
                
                {hasMoreCollection && !loading && (
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
              </>
            )}
            
            {loading && collectionGames.length > 0 && (
              <div className={styles.loadingMoreContainer}>
                <div className={styles.spinner}></div>
                <p>Loading more games...</p>
              </div>
            )}
          </>
        )}
      </main>
      
      {isCreatingList && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <CreateListForm 
              onClose={() => setIsCreatingList(false)}
              onSuccess={handleListCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

