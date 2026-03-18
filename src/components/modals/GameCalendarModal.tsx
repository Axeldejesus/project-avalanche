"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MonitorSmartphone,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Modal from './Modal';
import PlatformImage from '../PlatformImage';

// Types
interface Game {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  platforms: number[];
}

interface CalendarGames {
  [month: string]: Game[];
}

interface GameCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Constants
const PLATFORM_OPTIONS = [
  { key: 'PS5', id: 167, label: 'PlayStation 5' },
  { key: 'XBOX', id: 169, label: 'Xbox Series' },
  { key: 'SWITCH', id: 130, label: 'Nintendo Switch' },
  { key: 'MOBILE', id: 34, label: 'Mobile' },
] as const;

const DEFAULT_PLATFORM_ID = PLATFORM_OPTIONS[0].id;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_FR: Record<string, string> = {
  January: 'Janvier', February: 'Février', March: 'Mars',
  April: 'Avril', May: 'Mai', June: 'Juin',
  July: 'Juillet', August: 'Août', September: 'Septembre',
  October: 'Octobre', November: 'Novembre', December: 'Décembre',
};

const QUARTERS: Record<number, string[]> = {
  1: ['January', 'February', 'March'],
  2: ['April', 'May', 'June'],
  3: ['July', 'August', 'September'],
  4: ['October', 'November', 'December'],
};

// Sub-components
interface CalendarHeaderProps {
  year: number;
  changeYear: (increment: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  year,
  changeYear,
  searchTerm,
  setSearchTerm,
  isSearching,
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <button
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        onClick={() => changeYear(-1)}
        aria-label="Année précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Release radar</p>
        <div className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{year}</span>
        </div>
      </div>
      <button
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        onClick={() => changeYear(1)}
        aria-label="Année suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>

    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        className="h-11 border-white/10 bg-black/20 pl-9 pr-20"
        placeholder={`Rechercher une sortie en ${year}…`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {isSearching && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          Recherche…
        </span>
      )}
    </div>
  </div>
);

interface PlatformFiltersProps {
  selectedPlatforms: number[];
  togglePlatformFilter: (platformId: number) => void;
}

const PlatformFilters: React.FC<PlatformFiltersProps> = ({
  selectedPlatforms,
  togglePlatformFilter,
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <MonitorSmartphone className="h-3.5 w-3.5" />
      Plateforme focus
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {PLATFORM_OPTIONS.map(({ key, id, label }) => (
        <button
          key={`${key}-${id}`}
          className={cn(
            'flex items-center gap-2 rounded-[18px] border px-3 py-3 text-sm transition-colors',
            selectedPlatforms.includes(id)
              ? 'border-primary/30 bg-primary/10 text-foreground'
              : 'border-white/8 bg-white/4 text-muted-foreground hover:border-white/12 hover:bg-white/8 hover:text-foreground'
          )}
          onClick={() => togglePlatformFilter(id)}
        >
          <PlatformImage
            platformId={id}
            platformName={key === 'MOBILE' ? 'Mobile' : undefined}
            alt={key}
            size={18}
          />
          <span>{label}</span>
        </button>
      ))}
    </div>
  </div>
);

interface QuarterTabsProps {
  activeQuarter: number;
  setActiveQuarter: (quarter: number) => void;
}

const QuarterTabs: React.FC<QuarterTabsProps> = ({ activeQuarter, setActiveQuarter }) => (
  <div className="grid grid-cols-4 gap-2">
    {[1, 2, 3, 4].map((quarter) => (
      <button
        key={quarter}
        className={cn(
          'rounded-2xl border py-2.5 text-center text-xs font-medium transition-colors',
          activeQuarter === quarter
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-white/8 bg-white/4 text-muted-foreground hover:border-white/12 hover:bg-white/8 hover:text-foreground'
        )}
        onClick={() => setActiveQuarter(quarter)}
      >
        T{quarter}
      </button>
    ))}
  </div>
);

interface MonthNavigationProps {
  activeQuarter: number;
  selectedMonth: string | null;
  scrollToMonth: (month: string) => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
  activeQuarter,
  selectedMonth,
  scrollToMonth,
}) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {QUARTERS[activeQuarter].map((month) => (
      <button
        key={month}
        className={cn(
          'min-w-[88px] rounded-full border px-3 py-2 text-center text-xs transition-colors',
          selectedMonth === month
            ? 'border-primary/30 bg-primary/10 font-medium text-foreground'
            : 'border-white/8 bg-white/4 text-muted-foreground hover:text-foreground'
        )}
        onClick={() => scrollToMonth(month)}
      >
        {MONTHS_FR[month].slice(0, 4)}
      </button>
    ))}
  </div>
);

interface GameItemProps {
  game: Game;
  formatDate: (timestamp: number) => string;
  onGameClick: (gameId: number) => void;
}

const GameItem: React.FC<GameItemProps> = ({ game, formatDate, onGameClick }) => (
  <button
    type="button"
    className="flex w-full items-center gap-3 rounded-[18px] border border-white/8 bg-white/4 p-3 text-left transition-colors hover:bg-white/8"
    onClick={() => onGameClick(game.id)}
  >
    <div className="w-16 flex-shrink-0 rounded-[14px] border border-white/8 bg-black/20 px-2 py-3 text-center">
      <p className="text-[11px] uppercase tracking-[0.14em] text-primary/80">Date</p>
      <p className="mt-2 text-xs font-medium text-foreground">{formatDate(game.release_date)}</p>
    </div>
    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-[14px] border border-white/8">
      <img src={game.cover} alt={game.name} className="h-full w-full object-cover" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="line-clamp-2 text-sm font-semibold text-foreground">{game.name}</p>
      <div className="mt-2 flex gap-1">
        {game.platforms.map((platformId, idx) => (
          <span key={`${platformId}-${idx}`} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/8 bg-black/20">
            <PlatformImage platformId={platformId} alt="" size={14} />
          </span>
        ))}
      </div>
    </div>
  </button>
);

interface MonthSectionProps {
  month: string;
  year: number;
  games: Game[];
  formatDate: (timestamp: number) => string;
  onGameClick: (gameId: number) => void;
  setRef: (el: HTMLDivElement | null) => void;
}

const MonthSection: React.FC<MonthSectionProps> = ({
  month,
  year,
  games,
  formatDate,
  onGameClick,
  setRef,
}) => (
  <div className="surface-panel mb-4 rounded-[24px] p-5" ref={setRef}>
    <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-3">
      <h3 className="text-base font-semibold text-foreground">
        {MONTHS_FR[month]} {year}
      </h3>
      <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
        {games.length} jeu{games.length > 1 ? 'x' : ''}
      </span>
    </div>
    <div className="grid gap-3">
      {games.map((game, idx) => (
        <GameItem
          key={`${game.id}-${idx}`}
          game={game}
          formatDate={formatDate}
          onGameClick={onGameClick}
        />
      ))}
    </div>
  </div>
);

interface StatusDisplayProps {
  loading: boolean;
  error: string | null;
  searchTerm: string;
  hasResults: boolean;
  activeQuarter: number;
  year: number;
  onRetry?: () => void;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
  loading,
  error,
  searchTerm,
  hasResults,
  activeQuarter,
  year,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-white/8 bg-white/4 py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Chargement…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-destructive/20 bg-destructive/10 py-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-primary hover:underline"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (searchTerm && !hasResults) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/4 py-8 text-center text-sm text-muted-foreground">
        Aucun jeu trouvé pour &laquo;&nbsp;{searchTerm}&nbsp;&raquo;
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/4 py-8 text-center text-sm text-muted-foreground">
        Aucune sortie pour T{activeQuarter} {year} avec ces filtres.
      </div>
    );
  }

  return null;
};

// Main component
const GameCalendarModal: React.FC<GameCalendarModalProps> = ({ isOpen, onClose }) => {
  const [calendarGames, setCalendarGames] = useState<CalendarGames>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([DEFAULT_PLATFORM_ID]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CalendarGames>({});
  const [activeQuarter, setActiveQuarter] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const minSwipeDistance = 50;

  const monthRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const contentRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Initialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);

      setSelectedPlatforms([DEFAULT_PLATFORM_ID]);
      setYear(currentYear);
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setSearchResults({});
      setActiveQuarter(currentQuarter);
      setSelectedMonth(null);
      setCalendarGames({});
    }
  }, [isOpen]);

  // Charger les jeux
  useEffect(() => {
    if (isOpen) {
      fetchCalendarGames();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedPlatforms, year]);

  // Debounce recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtrer les résultats de recherche
  useEffect(() => {
    if (debouncedSearchTerm.length < 2) {
      setSearchResults({});
      return;
    }

    const results: CalendarGames = {};
    const lower = debouncedSearchTerm.toLowerCase();

    Object.keys(calendarGames).forEach((month) => {
      if (!calendarGames[month]) return;
      const matching = calendarGames[month]
        .filter((game) => game.name.toLowerCase().includes(lower))
        .slice(0, 10);
      if (matching.length > 0) results[month] = matching;
    });

    setSearchResults(results);
  }, [debouncedSearchTerm, calendarGames]);

  const fetchCalendarGames = async () => {
    setLoading(true);
    setError(null);

    try {
      const platformParams = selectedPlatforms.length > 0
        ? `platforms=${selectedPlatforms.join(',')}`
        : '';
      const fetchUrl = `/api/calendar-games?year=${year}${platformParams ? `&${platformParams}` : ''}`;
      const response = await fetch(fetchUrl);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setCalendarGames(data);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Impossible de charger le calendrier. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatformFilter = (platformId: number) => {
    if (selectedPlatforms.includes(platformId)) return;
    setSelectedPlatforms([platformId]);
    setCalendarGames({});
  };

  const handleGameClick = (gameId: number) => {
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromHome');
    sessionStorage.removeItem('cameFromProfile');
    sessionStorage.removeItem('cameFromCollection');
    sessionStorage.setItem('cameFromCalendar', 'true');
    router.push(`/games/${gameId}`);
    onClose();
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const changeYear = (increment: number) => {
    setCalendarGames({});
    setYear((prev) => prev + increment);
    setActiveQuarter(1);
    setSelectedMonth(null);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSearchResults({});
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToMonth = (month: string) => {
    setSelectedMonth(month);
    setTimeout(() => {
      monthRefs.current[month]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && activeQuarter < 4) setActiveQuarter((q) => q + 1);
    if (distance < -minSwipeDistance && activeQuarter > 1) setActiveQuarter((q) => q - 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 300);
  };

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredGames = useMemo(() => {
    if (debouncedSearchTerm.trim()) return searchResults;
    return calendarGames;
  }, [debouncedSearchTerm, calendarGames, searchResults]);

  const hasGamesInQuarter = (quarter: number): boolean =>
    QUARTERS[quarter].some(
      (month) => filteredGames[month] && filteredGames[month].length > 0
    );

  const isSearching = searchTerm.length > 0 && debouncedSearchTerm !== searchTerm;

  const hasSearchResults = debouncedSearchTerm.trim()
    ? Object.values(searchResults).flat().length > 0
    : true;

  const visibleMonths = useMemo(
    () => MONTHS.filter((month) => (!debouncedSearchTerm ? QUARTERS[activeQuarter].includes(month) : true)),
    [activeQuarter, debouncedSearchTerm]
  );

  const visibleGamesCount = useMemo(() => {
    return visibleMonths.reduce((total, month) => total + (filteredGames[month]?.length || 0), 0);
  }, [filteredGames, visibleMonths]);

  const selectedPlatformLabel =
    PLATFORM_OPTIONS.find((platform) => selectedPlatforms.includes(platform.id))?.label || 'Plateforme';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calendrier des sorties"
      description="Une vue plus claire pour suivre ton année gaming par plateforme, trimestre et mois."
      size="xxl"
      className="sm:max-w-6xl"
    >
      <div
        ref={contentRef}
        className="max-h-[80vh] space-y-6 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <section className="surface-panel surface-noise relative overflow-hidden rounded-[28px] p-5 md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,191,161,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(247,201,93,0.12),transparent_24%)]" />
          <div className="relative z-10 space-y-5">
            <CalendarHeader
              year={year}
              changeYear={changeYear}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isSearching={isSearching}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <MonitorSmartphone className="h-3.5 w-3.5" />
                  Plateforme
                </div>
                <p className="mt-3 text-lg font-semibold text-foreground">{selectedPlatformLabel}</p>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trimestre actif
                </div>
                <p className="mt-3 text-lg font-semibold text-foreground">T{activeQuarter}</p>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Sorties visibles
                </div>
                <p className="mt-3 text-lg font-semibold text-foreground">{visibleGamesCount}</p>
              </div>
            </div>

            <PlatformFilters
              selectedPlatforms={selectedPlatforms}
              togglePlatformFilter={togglePlatformFilter}
            />

            <div className="space-y-3">
              <QuarterTabs activeQuarter={activeQuarter} setActiveQuarter={setActiveQuarter} />
              <MonthNavigation
                activeQuarter={activeQuarter}
                selectedMonth={selectedMonth}
                scrollToMonth={scrollToMonth}
              />
            </div>
          </div>
        </section>

        <StatusDisplay
          loading={loading}
          error={error}
          searchTerm={debouncedSearchTerm.trim()}
          hasResults={
            debouncedSearchTerm.trim()
              ? Object.values(searchResults).flat().length > 0
              : hasGamesInQuarter(activeQuarter)
          }
          activeQuarter={activeQuarter}
          year={year}
          onRetry={fetchCalendarGames}
        />

        {!loading && !error && (
          <div className="grid gap-4 2xl:grid-cols-3 xl:grid-cols-2">
            {MONTHS.map((month) => {
              if (!debouncedSearchTerm && !QUARTERS[activeQuarter].includes(month)) return null;
              if (!filteredGames[month] || filteredGames[month].length === 0) return null;

              return (
                <MonthSection
                  key={`${year}-${month}`}
                  month={month}
                  year={year}
                  games={filteredGames[month]}
                  formatDate={formatDate}
                  onGameClick={handleGameClick}
                  setRef={(el) => { monthRefs.current[month] = el; }}
                />
              );
            })}
          </div>
        )}

        <div
          className={cn(
            'sticky bottom-2 flex justify-end mt-2 transition-opacity',
            showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-primary text-primary-foreground shadow-lg"
            onClick={scrollToTop}
            aria-label="Retour en haut"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GameCalendarModal;
