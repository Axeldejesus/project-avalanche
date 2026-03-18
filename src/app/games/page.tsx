'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Filter,
  Gamepad2,
  Grid2X2,
  List,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import GameCard from '@/components/GameCard';
import PageIntro from '@/components/PageIntro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

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

const DEFAULT_FILTERS: FilterOptions = {
  platforms: [],
  genres: [],
  releaseYear: null,
  searchQuery: '',
  releaseStatus: 'all',
  sort: 'default',
};

const PLATFORMS = [
  { id: 167, name: 'PlayStation 5' },
  { id: 169, name: 'Xbox Series X' },
  { id: 130, name: 'Nintendo Switch' },
  { id: 6, name: 'PC' },
  { id: 48, name: 'PlayStation 4' },
  { id: 49, name: 'Xbox One' },
];

const YEARS = Array.from(
  { length: new Date().getFullYear() - 1980 + 1 },
  (_, index) => new Date().getFullYear() - index
);

const RELEASE_STATUS = [
  { value: 'all', label: 'Tous les jeux' },
  { value: 'released', label: 'Déjà sortis' },
  { value: 'upcoming', label: 'À venir' },
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Pertinence' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'release_desc', label: 'Sorties récentes' },
  { value: 'release_asc', label: 'Prochaines sorties' },
  { value: 'name', label: 'Nom A-Z' },
];

const QUICK_FILTERS = [
  {
    key: 'all',
    label: 'À la une',
    description: 'Catalogue sans filtre',
    icon: Sparkles,
    filters: { ...DEFAULT_FILTERS },
  },
  {
    key: 'best-rated',
    label: 'Top notes',
    description: 'Jeux les mieux évalués',
    icon: Star,
    filters: { ...DEFAULT_FILTERS, sort: 'rating' },
  },
  {
    key: 'recent',
    label: 'Sorties récentes',
    description: 'Déjà sortis, tri desc',
    icon: Package,
    filters: { ...DEFAULT_FILTERS, sort: 'release_desc', releaseStatus: 'released' as const },
  },
  {
    key: 'upcoming',
    label: 'À surveiller',
    description: 'Calendrier à venir',
    icon: Gamepad2,
    filters: { ...DEFAULT_FILTERS, sort: 'release_asc', releaseStatus: 'upcoming' as const },
  },
];

function FilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function GamesPage() {
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState('all');
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [genres, setGenres] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    sessionStorage.setItem('cameFromGames', 'true');

    const savedFilters = sessionStorage.getItem('gameFilters');
    const savedViewMode = localStorage.getItem('gamesViewMode');

    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }

    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters) as Partial<FilterOptions>;
        const nextFilters: FilterOptions = {
          platforms: parsedFilters.platforms || [],
          genres: parsedFilters.genres || [],
          releaseYear: parsedFilters.releaseYear || null,
          searchQuery: parsedFilters.searchQuery || '',
          releaseStatus:
            parsedFilters.releaseStatus === 'released' || parsedFilters.releaseStatus === 'upcoming'
              ? parsedFilters.releaseStatus
              : 'all',
          sort: parsedFilters.sort || 'default',
        };
        setFilters(nextFilters);
        setTempFilters(nextFilters);
      } catch {
        sessionStorage.setItem('gameFilters', JSON.stringify(DEFAULT_FILTERS));
      }
    }

    setFiltersInitialized(true);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await fetch('/api/genres');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setGenres(
          data.filter(
            (genre: { id?: unknown; name?: unknown }) =>
              typeof genre.id === 'number' && typeof genre.name === 'string'
          )
        );
      } catch (genresError) {
        console.error('Error loading genres:', genresError);
      }
    };

    loadGenres();
  }, []);

  useEffect(() => {
    if (!filtersInitialized) {
      return;
    }

    setGames([]);
    setPage(1);
    setHasMore(true);
    void fetchGames(1, true, filters);
  }, [filters, filtersInitialized]);

  useEffect(() => {
    const activeQuickFilter = QUICK_FILTERS.find(({ filters: quickFilters }) => {
      return JSON.stringify(quickFilters) === JSON.stringify({ ...filters, searchQuery: '' }) && filters.searchQuery === '';
    });

    setSelectedQuickFilter(activeQuickFilter?.key ?? 'custom');
  }, [filters]);

  useEffect(() => {
    if (loading) {
      return;
    }

    observer.current?.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          void fetchGames(nextPage, false, filters);
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => observer.current?.disconnect();
  }, [filters, hasMore, loading, page]);

  useEffect(() => {
    localStorage.setItem('gamesViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!scrollRestored && games.length > 0 && !loading) {
      const savedScrollPosition = sessionStorage.getItem('gamesScrollPosition');
      if (savedScrollPosition) {
        const position = Number(savedScrollPosition);
        window.scrollTo({ top: position, behavior: 'instant' as ScrollBehavior });
        setTimeout(() => {
          sessionStorage.removeItem('gamesScrollPosition');
          setScrollRestored(true);
        }, 100);
      } else {
        setScrollRestored(true);
      }
    }
  }, [games.length, loading, scrollRestored]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.platforms.length > 0) count += 1;
    if (filters.genres.length > 0) count += 1;
    if (filters.releaseYear !== null) count += 1;
    if (filters.releaseStatus !== 'all') count += 1;
    if (filters.sort !== 'default') count += 1;
    return count;
  }, [filters]);

  const activeFilterBadges = useMemo(() => {
    const badges: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (filters.platforms.length > 0) {
      badges.push({
        key: 'platforms',
        label: `${filters.platforms.length} plateforme${filters.platforms.length > 1 ? 's' : ''}`,
        onRemove: () => updateFilters({ platforms: [] }),
      });
    }

    if (filters.genres.length > 0) {
      badges.push({
        key: 'genres',
        label: `${filters.genres.length} genre${filters.genres.length > 1 ? 's' : ''}`,
        onRemove: () => updateFilters({ genres: [] }),
      });
    }

    if (filters.releaseYear !== null) {
      badges.push({
        key: 'year',
        label: `${filters.releaseYear}`,
        onRemove: () => updateFilters({ releaseYear: null }),
      });
    }

    if (filters.releaseStatus !== 'all') {
      badges.push({
        key: 'status',
        label: RELEASE_STATUS.find(({ value }) => value === filters.releaseStatus)?.label || 'Statut',
        onRemove: () => updateFilters({ releaseStatus: 'all' }),
      });
    }

    if (filters.sort !== 'default') {
      badges.push({
        key: 'sort',
        label: SORT_OPTIONS.find(({ value }) => value === filters.sort)?.label || 'Tri',
        onRemove: () => updateFilters({ sort: 'default' }),
      });
    }

    return badges;
  }, [filters]);

  const statusLabel = useMemo(() => {
    return RELEASE_STATUS.find(({ value }) => value === filters.releaseStatus)?.label || 'Tous les jeux';
  }, [filters.releaseStatus]);

  const updateFilters = (partial: Partial<FilterOptions>, options?: { syncTemp?: boolean }) => {
    const nextFilters = { ...filters, ...partial };
    setFilters(nextFilters);
    if (options?.syncTemp !== false) {
      setTempFilters(nextFilters);
    }
    sessionStorage.setItem('gameFilters', JSON.stringify(nextFilters));
  };

  const fetchGames = async (pageNumber: number, resetList: boolean, nextFilters: FilterOptions) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNumber.toString(),
        sort: nextFilters.sort,
      });

      if (nextFilters.platforms.length > 0) {
        params.set('platforms', nextFilters.platforms.join(','));
      }

      if (nextFilters.genres.length > 0) {
        params.set('genres', nextFilters.genres.join(','));
      }

      if (nextFilters.searchQuery.trim()) {
        params.set('search', nextFilters.searchQuery.trim());
      }

      if (nextFilters.releaseYear !== null) {
        params.set('releaseYear', String(nextFilters.releaseYear));
      }

      if (nextFilters.releaseStatus !== 'all') {
        params.set('releaseStatus', nextFilters.releaseStatus);
      }

      const response = await fetch(`/api/games?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      const fetchedGames = data.games || [];

      setGames((current) => (resetList ? fetchedGames : [...current, ...fetchedGames]));
      setHasMore(fetchedGames.length > 0);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Impossible de charger le catalogue pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = (gameId: number) => {
    sessionStorage.setItem('gamesScrollPosition', window.scrollY.toString());
    sessionStorage.setItem('gameFilters', JSON.stringify(filters));
    sessionStorage.setItem('cameFromGames', 'true');
    router.push(`/games/${gameId}`);
  };

  const handleQuickFilter = (key: string) => {
    const preset = QUICK_FILTERS.find((item) => item.key === key);
    if (!preset) {
      return;
    }
    setSelectedQuickFilter(key);
    updateFilters(preset.filters);
  };

  const handleSearchChange = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setFilters((current) => ({ ...current, searchQuery: value }));
    setTempFilters((current) => ({ ...current, searchQuery: value }));

    searchTimeoutRef.current = setTimeout(() => {
      const nextFilters = { ...filters, searchQuery: value };
      sessionStorage.setItem('gameFilters', JSON.stringify(nextFilters));
      setFilters(nextFilters);
      setTempFilters(nextFilters);
    }, 250);
  };

  const toggleArrayFilter = (
    key: 'platforms' | 'genres',
    value: number,
    applyImmediately = true
  ) => {
    const source = applyImmediately ? filters : tempFilters;
    const nextValues = source[key].includes(value)
      ? source[key].filter((item) => item !== value)
      : [...source[key], value];

    if (applyImmediately) {
      updateFilters({ [key]: nextValues } as Partial<FilterOptions>);
      return;
    }

    setTempFilters((current) => ({ ...current, [key]: nextValues }));
  };

  const resetAllFilters = () => {
    setSelectedQuickFilter('all');
    setTempFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    sessionStorage.setItem('gameFilters', JSON.stringify(DEFAULT_FILTERS));
  };

  const applyMobileFilters = () => {
    setFilters(tempFilters);
    sessionStorage.setItem('gameFilters', JSON.stringify(tempFilters));
    setIsMobileFiltersOpen(false);
  };

  const renderFilterControls = (mobile: boolean) => {
    const sourceFilters = mobile ? tempFilters : filters;

    return (
      <div className="space-y-4">
        <FilterSection title="Plateformes" description="Cible ton écosystème prioritaire.">
          <div className="grid gap-2">
            {PLATFORMS.map((platform) => {
              const active = sourceFilters.platforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => toggleArrayFilter('platforms', platform.id, !mobile)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-primary/30 bg-primary/10 text-foreground'
                      : 'border-white/8 bg-white/4 text-muted-foreground hover:bg-white/8 hover:text-foreground'
                  )}
                >
                  <span>{platform.name}</span>
                  {active ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Genres" description="Affiner les boucles de jeu ou l'ambiance recherchée.">
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
            {genres.map((genre) => {
              const active = sourceFilters.genres.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleArrayFilter('genres', genre.id, !mobile)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-primary/30 bg-primary/10 text-foreground'
                      : 'border-white/8 bg-white/4 text-muted-foreground hover:bg-white/8 hover:text-foreground'
                  )}
                >
                  <span>{genre.name}</span>
                  {active ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Année" description="Filtrer un millésime précis.">
          <Select
            value={sourceFilters.releaseYear === null ? 'all' : String(sourceFilters.releaseYear)}
            onValueChange={(value) => {
              if (mobile) {
                setTempFilters((current) => ({
                  ...current,
                  releaseYear: value === 'all' ? null : Number(value),
                }));
                return;
              }

              updateFilters({ releaseYear: value === 'all' ? null : Number(value) });
            }}
          >
            <SelectTrigger className="w-full border-white/10 bg-black/20">
              <SelectValue placeholder="Toutes les années" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {YEARS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>

        <FilterSection title="Statut de sortie" description="Séparer l'actuel du calendrier à venir.">
          <div className="grid gap-2">
            {RELEASE_STATUS.map((status) => {
              const active = sourceFilters.releaseStatus === status.value;
              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => {
                    if (mobile) {
                      setTempFilters((current) => ({
                        ...current,
                        releaseStatus: status.value as FilterOptions['releaseStatus'],
                      }));
                      return;
                    }

                    updateFilters({ releaseStatus: status.value as FilterOptions['releaseStatus'] });
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-primary/30 bg-primary/10 text-foreground'
                      : 'border-white/8 bg-white/4 text-muted-foreground hover:bg-white/8 hover:text-foreground'
                  )}
                >
                  <span>{status.label}</span>
                  {active ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </FilterSection>
      </div>
    );
  };

  return (
    <AppShell contentClassName="space-y-6">
      <PageIntro
        eyebrow="Explorer"
        title="Trouver le bon jeu vite, sans se battre contre les filtres."
        description="L’Explorer est maintenant structuré autour de presets utiles, d’un vrai tri branché à l’API et d’un panneau de filtres plus lisible sur desktop comme sur mobile."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 hover:bg-white/8"
              onClick={resetAllFilters}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-full px-3 py-2 text-sm transition-colors',
                  viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-full px-3 py-2 text-sm transition-colors',
                  viewMode === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[22px] border border-white/8 bg-black/15 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Résultats</p>
              <Gamepad2 className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">{games.length}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-black/15 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Filtres</p>
              <Filter className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-foreground">{activeFiltersCount}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-black/15 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Statut</p>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">{statusLabel}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-black/15 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tri</p>
              <SlidersHorizontal className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {SORT_OPTIONS.find(({ value }) => value === filters.sort)?.label || 'Pertinence'}
            </p>
          </div>
        </div>
      </PageIntro>

      <section className="grid gap-6 xl:grid-cols-[300px_1fr]">
        {!isMobile ? (
          <Card className="surface-panel sticky top-[104px] gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Affiner l'exploration
              </CardTitle>
              <CardDescription>
                Combine plateforme, genre, année et statut sans perdre de temps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              {renderFilterControls(false)}
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-5">
          <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
            <CardContent className="space-y-5 px-6 py-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Rechercher un jeu, une saga, une idée de soirée..."
                    className="h-12 border-white/10 bg-black/20 pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select value={filters.sort} onValueChange={(value) => updateFilters({ sort: value })}>
                    <SelectTrigger className="h-12 w-[190px] border-white/10 bg-black/20">
                      <SelectValue placeholder="Choisir un tri" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {isMobile ? (
                    <Button
                      variant="outline"
                      className="h-12 gap-2 border-white/10 bg-white/5"
                      onClick={() => setIsMobileFiltersOpen(true)}
                    >
                      <Filter className="h-4 w-4" />
                      Filtres
                      {activeFiltersCount > 0 ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                          {activeFiltersCount}
                        </span>
                      ) : null}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {QUICK_FILTERS.map(({ key, label, description, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleQuickFilter(key)}
                      className={cn(
                        'rounded-[22px] border p-4 text-left transition-all',
                        selectedQuickFilter === key
                          ? 'border-primary/30 bg-primary/10 text-foreground'
                          : 'border-white/8 bg-white/4 text-muted-foreground hover:bg-white/8 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-4 w-4 text-primary" />
                        {selectedQuickFilter === key ? <Check className="h-4 w-4 text-primary" /> : null}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-[24px] border border-white/8 bg-black/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Contexte actif
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeFilterBadges.length > 0 ? (
                      activeFilterBadges.map((badge) => (
                        <button
                          key={badge.key}
                          type="button"
                          onClick={badge.onRemove}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-foreground transition-colors hover:bg-white/10"
                        >
                          {badge.label}
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucun filtre bloquant. Tu navigues sur une vue catalogue large.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && games.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="surface-panel h-[360px] animate-pulse rounded-[24px] border-white/8"
                />
              ))}
            </div>
          ) : error ? (
            <EmptyState title="Catalogue indisponible" description={error} />
          ) : games.length === 0 ? (
            <EmptyState
              title="Aucun jeu trouvé"
              description="Le filtre actuel est trop serré. Allège les contraintes ou reviens sur un preset plus large."
              actions={
                <Button onClick={resetAllFilters} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              }
            />
          ) : viewMode === 'grid' || isMobile ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  className="h-full"
                  onClick={handleGameClick}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleGameClick(game.id)}
                  className="surface-panel group flex w-full items-center gap-4 rounded-[24px] border-white/8 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/20"
                >
                  <img
                    src={game.cover}
                    alt={game.name}
                    className="h-24 w-[72px] rounded-[16px] object-cover sm:h-28 sm:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{game.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {game.genres || 'Genres non renseignés'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-amber-200">
                        <Star className="h-4 w-4 fill-current" />
                        {game.rating > 0 ? game.rating.toFixed(1) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div ref={loadingRef} className="flex min-h-10 items-center justify-center">
            {loading && hasMore ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Chargement d'autres jeux...
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto border-t border-white/10 bg-[rgba(9,15,23,0.98)]">
          <SheetHeader className="px-1 pb-0">
            <SheetTitle className="text-left text-xl">Filtres Explorer</SheetTitle>
            <SheetDescription className="text-left">
              Ajuste les critères puis applique une vue plus propre du catalogue.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-1 pb-24 pt-4">
            {renderFilterControls(true)}
          </div>
          <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-white/10 bg-[rgba(9,15,23,0.98)] px-1 py-4">
            <Button variant="outline" className="border-white/10 bg-white/5" onClick={resetAllFilters}>
              Reset
            </Button>
            <Button onClick={applyMobileFilters}>Appliquer</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}