'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  CalendarDays,
  Clock3,
  Heart,
  Layers3,
  MonitorSmartphone,
  PieChart,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { getUserCollectionForStats } from '@/services/collectionService';
import { type CollectionItem, type CollectionStats } from '@/schemas';
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
  Filler,
} from 'chart.js';
import { CacheManager } from '@/utils/cacheManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
        const cachedData = CacheManager.get<{
          stats: CollectionStats;
          items: CollectionItem[];
        }>(`statsCache_${userId}`);
        
        if (cachedData) {
          setStats(cachedData.stats);
          setGames(cachedData.items);
          
          if (cachedData.items && cachedData.items.length > 0) {
            analyzeCollectionData(cachedData.items);
          }
          
          setIsLoading(false);
          return;
        }
        
        const result = await getUserCollectionForStats(userId);
        
        if (result.error) {
          setError(result.error);
        } else {
          setStats(result.stats);
          setGames(result.items);
          
          if (result.items && result.items.length > 0) {
            analyzeCollectionData(result.items);
          }
          
          CacheManager.set(
            `statsCache_${userId}`,
            {
              stats: result.stats,
              items: result.items
            },
            true
          );
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

  const percentage = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
  
  const platformChartData = {
    labels: platforms.map(p => p.name),
    datasets: [
      {
        data: platforms.map(p => p.count),
        backgroundColor: platforms.map(p => p.color),
        borderColor: 'rgba(6, 10, 18, 0.85)',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };
  
  const genreChartData = {
    labels: genres.map(g => g.name),
    datasets: [
      {
        data: genres.map(g => g.count),
        backgroundColor: genres.map(g => g.color),
        borderColor: 'rgba(6, 10, 18, 0.85)',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };
  
  const yearChartData = {
    labels: yearsData.map(y => y.year.toString()),
    datasets: [
      {
        label: 'Jeux ajoutes',
        data: yearsData.map(y => y.count),
        borderColor: '#10bfa1',
        backgroundColor: 'rgba(16, 191, 161, 0.18)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '64%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(229, 231, 235, 0.82)',
          padding: 14,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 22, 0.96)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 12,
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(229, 231, 235, 0.82)',
          padding: 14,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 22, 0.96)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 12,
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(229, 231, 235, 0.6)' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(229, 231, 235, 0.6)', precision: 0 },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  const statusCards = stats
    ? [
        { label: 'Termines', value: stats.completed, icon: Trophy, tone: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/20' },
        { label: 'En cours', value: stats.playing, icon: Activity, tone: 'text-sky-200 bg-sky-400/10 border-sky-400/20' },
        { label: 'Backlog', value: stats.toPlay, icon: Clock3, tone: 'text-amber-200 bg-amber-400/10 border-amber-400/20' },
        { label: 'Wishlist', value: stats.wishlist, icon: Heart, tone: 'text-fuchsia-200 bg-fuchsia-400/10 border-fuchsia-400/20' },
        { label: 'Abandonnes', value: stats.abandoned, icon: XCircle, tone: 'text-rose-200 bg-rose-400/10 border-rose-400/20' },
      ]
    : [];

  const leadPlatform = platforms[0];
  const leadGenre = genres[0];
  const latestYear = yearsData[yearsData.length - 1];

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[28px] border border-white/8 bg-white/4" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-destructive/20 bg-destructive/10 px-5 py-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (games.length === 0 || !stats) {
    return (
      <div className="rounded-[28px] border border-white/8 bg-white/4 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-foreground">Aucune statistique disponible</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajoute des jeux a ta collection pour faire apparaitre des tendances de plateformes, de genres et de progression.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel surface-noise relative overflow-hidden rounded-[30px] p-6 md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,191,161,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(247,201,93,0.12),transparent_24%)]" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Tableau de bord</p>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
              Une lecture immediate de ta bibliotheque: rythme, completion et terrains de predilection.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              La collection ne sert pas juste a stocker des jeux. Elle raconte tes cycles, tes plateformes dominantes et ce que tu termines vraiment.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Jeux suivis</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{stats.total}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Taux de completion</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{percentage(stats.completed, stats.total)}%</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Backlog actif</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{stats.toPlay + stats.playing}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <MonitorSmartphone className="h-4 w-4" />
                Plateforme dominante
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{leadPlatform?.name || 'Aucune'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{leadPlatform ? `${leadPlatform.count} jeux dans ton historique` : 'Ajoute des plateformes pour voir une tendance.'}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Genre fort
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{leadGenre?.name || 'Aucun'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{leadGenre ? `${leadGenre.count} occurences dans la collection` : 'Ajoute des jeux pour faire emerger une preference.'}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Derniere dynamique
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{latestYear ? `${latestYear.year}` : 'Aucune annee'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{latestYear ? `${latestYear.count} jeu${latestYear.count > 1 ? 'x' : ''} ajoute${latestYear.count > 1 ? 's' : ''} sur la derniere annee visible.` : 'Ligne du temps indisponible.'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statusCards.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className={item.tone + ' rounded-[24px] border p-4'}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{item.label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-foreground">{item.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-current/75">{percentage(item.value, stats.total)}% de la bibliotheque</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="surface-panel rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
              <MonitorSmartphone className="h-5 w-5 text-primary" />
              Repartition par plateformes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="h-[320px]">
              {platforms.length > 0 ? <Doughnut data={platformChartData} options={doughnutOptions} /> : <p className="text-sm text-muted-foreground">Aucune donnee plateforme.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
              <PieChart className="h-5 w-5 text-primary" />
              Repartition par genres
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="h-[320px]">
              {genres.length > 0 ? <Doughnut data={genreChartData} options={doughnutOptions} /> : <p className="text-sm text-muted-foreground">Aucune donnee genre.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-panel rounded-[28px] border-white/8 bg-transparent py-0">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-xl text-foreground">
            <Layers3 className="h-5 w-5 text-primary" />
            Evolution de la collection
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="h-[320px]">
            {yearsData.length > 0 ? <Line data={yearChartData} options={lineOptions} /> : <p className="text-sm text-muted-foreground">Aucune ligne du temps exploitable.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="surface-panel rounded-[28px] border-white/8 bg-transparent py-0 xl:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-xl text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Lecture rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completion</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{stats.completed} jeux termines</p>
              <p className="mt-1 text-sm text-muted-foreground">Tu termines {percentage(stats.completed, stats.total)}% de ce que tu ajoutes.</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Saturation</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{stats.toPlay + stats.wishlist} jeux a surveiller</p>
              <p className="mt-1 text-sm text-muted-foreground">Le backlog et la wishlist restent le principal reservoir a arbitrer.</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Focus actuel</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{stats.playing} session{stats.playing > 1 ? 's' : ''} active{stats.playing > 1 ? 's' : ''}</p>
              <p className="mt-1 text-sm text-muted-foreground">Assez pour garder une rotation vive sans brouiller le suivi.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl text-foreground">Top plateformes</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {platforms.slice(0, 5).map((platform, index) => (
                <div key={platform.name} className="flex items-center justify-between rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/5 text-xs font-semibold text-muted-foreground">{index + 1}</span>
                    <span className="text-sm font-medium text-foreground">{platform.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{platform.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-panel rounded-[28px] border-white/8 bg-transparent py-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl text-foreground">Top genres</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {genres.slice(0, 5).map((genre, index) => (
              <div key={genre.name} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">#{index + 1}</p>
                <p className="mt-3 text-base font-semibold text-foreground">{genre.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{genre.count} jeu{genre.count > 1 ? 'x' : ''}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default StatsClient;
