'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiPieChart, FiBarChart2, FiAward, FiClock, FiPlay, 
  FiX, FiHeart, FiTv, FiCalendar
} from 'react-icons/fi';
import { 
  getUserCollectionStats, 
  getUserCollectionForStats, 
  CollectionItem, 
  CollectionStats 
} from '@/services/collectionService';
import styles from './stats.module.css';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface StatsClientProps {
  userId: string;
}

type PlatformCount = {
  name: string;
  count: number;
  color: string;
};

type GenreCount = {
  name: string;
  count: number;
  color: string;
};

type YearData = {
  year: number;
  count: number;
};

const StatsClient: React.FC<StatsClientProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [games, setGames] = useState<CollectionItem[]>([]);
  const [platforms, setPlatforms] = useState<PlatformCount[]>([]);
  const [genres, setGenres] = useState<GenreCount[]>([]);
  const [yearsData, setYearsData] = useState<YearData[]>([]);
  
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Charger les statistiques de base
        const statsResult = await getUserCollectionStats(userId);
        setStats(statsResult);
        
        // Charger tous les jeux pour l'analyse détaillée
        const gamesResult = await getUserCollectionForStats(userId);
        
        if (gamesResult.items && gamesResult.items.length > 0) {
          setGames(gamesResult.items);
          analyzeCollectionData(gamesResult.items);
        } else {
          setError("No games found in your collection");
        }
      } catch (error: any) {
        setError(error.message || "Failed to load statistics");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [userId]);
  
  const analyzeCollectionData = (games: CollectionItem[]) => {
    // Analyse des plateformes
    const platformMap = new Map<string, number>();
    const platformColors: {[key: string]: string} = {
      'PlayStation 5': '#006FCD',
      'PlayStation 4': '#003791',
      'Xbox Series X/S': '#107C10',
      'Xbox One': '#5DC21E',
      'Nintendo Switch': '#E60012',
      'PC': '#00ADEF',
      'Mobile': '#F25022',
      'Other': '#7B7B7B'
    };
    
    // Analyse des genres
    const genreMap = new Map<string, number>();
    const genreColors: {[key: string]: string} = {
      'Action': '#FF5252',
      'Adventure': '#FF9800',
      'RPG': '#9C27B0',
      'Strategy': '#3F51B5',
      'Simulation': '#009688',
      'Sports': '#4CAF50',
      'Racing': '#F44336',
      'Shooter': '#795548',
      'Platformer': '#8BC34A',
      'Puzzle': '#00BCD4',
      'Other': '#607D8B'
    };
    
    // Analyse des années d'ajout
    const yearMap = new Map<number, number>();
    
    games.forEach(game => {
      // Platforms analysis - prioritize the array of platforms if available
      if (game.platforms && game.platforms.length > 0) {
        // Compter chaque plateforme disponible
        game.platforms.forEach(platform => {
          platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
        });
      } else if (game.platform) {
        // Fallback to the single platform if platforms array is not available
        platformMap.set(game.platform, (platformMap.get(game.platform) || 0) + 1);
      } else {
        platformMap.set('Unknown', (platformMap.get('Unknown') || 0) + 1);
      }
      
      // Genres analysis - use all genres if available
      if (game.genres && game.genres.length > 0) {
        // Compter chaque genre disponible
        game.genres.forEach(genre => {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        });
      } else if (game.genre) {
        // Fallback to single genre
        const genre = game.genre || 'Other';
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      } else {
        genreMap.set('Other', (genreMap.get('Other') || 0) + 1);
      }
      
      // Year analysis
      if (game.addedAt) {
        const year = new Date(game.addedAt).getFullYear();
        yearMap.set(year, (yearMap.get(year) || 0) + 1);
      }
    });
    
    // Convert platform data for chart
    const platformData: PlatformCount[] = Array.from(platformMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        color: platformColors[name] || platformColors['Other']
      }))
      .sort((a, b) => b.count - a.count);
    
    // Convert genre data for chart
    const genreData: GenreCount[] = Array.from(genreMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        color: genreColors[name] || genreColors['Other']
      }))
      .sort((a, b) => b.count - a.count);
    
    // Convert year data for chart
    const yearData: YearData[] = Array.from(yearMap.entries())
      .map(([year, count]) => ({
        year,
        count
      }))
      .sort((a, b) => a.year - b.year);
    
    setPlatforms(platformData);
    setGenres(genreData);
    setYearsData(yearData);
  };
  
  // Configuration pour le graphique en anneau des plateformes
  const platformChartData = {
    labels: platforms.map(p => p.name),
    datasets: [
      {
        data: platforms.map(p => p.count),
        backgroundColor: platforms.map(p => p.color),
        borderColor: 'rgba(30, 30, 45, 0.8)',
        borderWidth: 2,
      },
    ],
  };
  
  // Configuration pour le graphique en anneau des genres
  const genreChartData = {
    labels: genres.map(g => g.name),
    datasets: [
      {
        data: genres.map(g => g.count),
        backgroundColor: genres.map(g => g.color),
        borderColor: 'rgba(30, 30, 45, 0.8)',
        borderWidth: 2,
      },
    ],
  };
  
  // Configuration pour le graphique en ligne des années
  const yearChartData = {
    labels: yearsData.map(y => y.year.toString()),
    datasets: [
      {
        label: 'Games Added',
        data: yearsData.map(y => y.count),
        borderColor: '#6c5ce7',
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  
  // Options communes pour les graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 45, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your gaming statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  return (
    <main className={styles.statsContainer}>
      <h1 className={styles.statsTitle}>Your Gaming Dashboard</h1>
      
      {games.length === 0 ? (
        <div className={styles.emptyStats}>
          <h2>No statistics available</h2>
          <p>Add games to your collection to see your gaming statistics</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIconWrapper}>
                <FiBarChart2 className={styles.summaryIcon} />
              </div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Total Games</span>
                <span className={styles.summaryValue}>{stats?.total || 0}</span>
              </div>
            </div>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryIconWrapper} style={{ backgroundColor: 'rgba(0, 184, 148, 0.2)', color: '#00b894' }}>
                <FiAward className={styles.summaryIcon} />
              </div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Completed</span>
                <span className={styles.summaryValue}>
                  {stats?.completed || 0}
                  <span className={styles.percentage}>
                    {stats && stats.total > 0 ? ` (${Math.round((stats.completed / stats.total) * 100)}%)` : ''}
                  </span>
                </span>
              </div>
            </div>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryIconWrapper} style={{ backgroundColor: 'rgba(108, 92, 231, 0.2)', color: '#6c5ce7' }}>
                <FiPlay className={styles.summaryIcon} />
              </div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Playing</span>
                <span className={styles.summaryValue}>
                  {stats?.playing || 0}
                  <span className={styles.percentage}>
                    {stats && stats.total > 0 ? ` (${Math.round((stats.playing / stats.total) * 100)}%)` : ''}
                  </span>
                </span>
              </div>
            </div>
            
            <div className={styles.summaryCard}>
              <div className={styles.summaryIconWrapper} style={{ backgroundColor: 'rgba(253, 203, 110, 0.2)', color: '#fdcb6e' }}>
                <FiClock className={styles.summaryIcon} />
              </div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>To Play</span>
                <span className={styles.summaryValue}>
                  {stats?.toPlay || 0}
                  <span className={styles.percentage}>
                    {stats && stats.total > 0 ? ` (${Math.round((stats.toPlay / stats.total) * 100)}%)` : ''}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Detailed statistics */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>
                <FiTv className={styles.chartIcon} />
                Platforms Distribution
              </h2>
              <div className={styles.chartContainer}>
                {platforms.length > 0 ? (
                  <Doughnut data={platformChartData} options={chartOptions} />
                ) : (
                  <p className={styles.noDataMessage}>No platform data available</p>
                )}
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>
                <FiPieChart className={styles.chartIcon} />
                Genres Distribution
              </h2>
              <div className={styles.chartContainer}>
                {genres.length > 0 ? (
                  <Doughnut data={genreChartData} options={chartOptions} />
                ) : (
                  <p className={styles.noDataMessage}>No genre data available</p>
                )}
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>
                <FiCalendar className={styles.chartIcon} />
                Games Added by Year
              </h2>
              <div className={styles.chartContainer}>
                {yearsData.length > 0 ? (
                  <Line data={yearChartData} options={chartOptions} />
                ) : (
                  <p className={styles.noDataMessage}>No timeline data available</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Top Lists */}
          <div className={styles.topLists}>
            <div className={styles.topListCard}>
              <h2 className={styles.topListTitle}>Top Platforms</h2>
              <ul className={styles.topListItems}>
                {platforms.slice(0, 5).map((platform, index) => (
                  <li key={platform.name} className={styles.topListItem}>
                    <span className={styles.topListRank}>{index + 1}</span>
                    <span className={styles.topListName}>{platform.name}</span>
                    <span className={styles.topListValue}>{platform.count} games</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={styles.topListCard}>
              <h2 className={styles.topListTitle}>Top Genres</h2>
              <ul className={styles.topListItems}>
                {genres.slice(0, 5).map((genre, index) => (
                  <li key={genre.name} className={styles.topListItem}>
                    <span className={styles.topListRank}>{index + 1}</span>
                    <span className={styles.topListName}>{genre.name}</span>
                    <span className={styles.topListValue}>{genre.count} games</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default StatsClient;
