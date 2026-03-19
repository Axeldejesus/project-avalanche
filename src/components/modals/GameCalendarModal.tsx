"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUp,
  ArrowUpRight,
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

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORM_OPTIONS = [
  { key: 'PS5',    id: 167, label: 'PlayStation 5'  },
  { key: 'XBOX',   id: 169, label: 'Xbox Series'    },
  { key: 'SWITCH', id: 130, label: 'Nintendo Switch' },
  { key: 'MOBILE', id: 34,  label: 'Mobile'          },
] as const;

const DEFAULT_PLATFORM_ID = PLATFORM_OPTIONS[0].id;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_FR: Record<string, string> = {
  January: 'Janvier',  February: 'Février',   March: 'Mars',
  April: 'Avril',      May: 'Mai',            June: 'Juin',
  July: 'Juillet',     August: 'Août',        September: 'Septembre',
  October: 'Octobre',  November: 'Novembre',  December: 'Décembre',
};

const QUARTERS: Record<number, string[]> = {
  1: ['January', 'February', 'March'],
  2: ['April', 'May', 'June'],
  3: ['July', 'August', 'September'],
  4: ['October', 'November', 'December'],
};

// ── CalendarHeader ─────────────────────────────────────────────────────────────
interface CalendarHeaderProps {
  year: number;
  changeYear: (increment: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
  selectedPlatformLabel: string;
  activeQuarter: number;
  visibleGamesCount: number;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  year,
  changeYear,
  searchTerm,
  setSearchTerm,
  isSearching,
  selectedPlatformLabel,
  activeQuarter,
  visibleGamesCount,
}) => (
  <div className="space-y-4">
    {/* Year + search row */}
    <div className="flex items-center gap-3">
      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => changeYear(-1)}
        aria-label="Année précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex flex-1 items-center justify-center gap-2">
        <Calendar className="h-4 w-4 text-primary/70" />
        <span className="font-oxanium text-lg font-black tracking-[0.12em] text-foreground">
          {year}
        </span>
        <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-primary/60 sm:block">
          Release Radar
        </span>
      </div>

      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => changeYear(1)}
        aria-label="Année suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>

    {/* Stats strip */}
    <div className="grid grid-cols-3 gap-2">
      <div className="flex items-center gap-2 rounded-[14px] border border-border bg-muted/25 px-3 py-2.5">
        <MonitorSmartphone className="h-3.5 w-3.5 shrink-0 text-primary/60" />
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Plateforme</p>
          <p className="truncate text-[12px] font-semibold text-foreground">{selectedPlatformLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-[14px] border border-border bg-muted/25 px-3 py-2.5">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/60" />
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Trimestre</p>
          <p className="font-oxanium text-[12px] font-semibold text-foreground">T{activeQuarter}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-[14px] border border-border bg-muted/25 px-3 py-2.5">
        <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Sorties</p>
          <p className="font-oxanium text-[12px] font-semibold text-foreground">{visibleGamesCount}</p>
        </div>
      </div>
    </div>

    {/* Search */}
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        className="h-10 border-border bg-muted/30 pl-9 pr-4 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
        placeholder={`Chercher un jeu en ${year}…`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  </div>
);

// ── PlatformFilters ─────────────────────────────────────────────────────────────
interface PlatformFiltersProps {
  selectedPlatforms: number[];
  togglePlatformFilter: (platformId: number) => void;
}

const PlatformFilters: React.FC<PlatformFiltersProps> = ({
  selectedPlatforms,
  togglePlatformFilter,
}) => (
  <div className="space-y-2">
    <p className="section-label">Plateforme focus</p>
    <div className="flex flex-wrap gap-2">
      {PLATFORM_OPTIONS.map(({ key, id, label }) => (
        <button
          key={`${key}-${id}`}
          className={cn('platform-chip', selectedPlatforms.includes(id) && 'active')}
          onClick={() => togglePlatformFilter(id)}
        >
          <PlatformImage
            platformId={id}
            platformName={key === 'MOBILE' ? 'Mobile' : undefined}
            alt={key}
            size={16}
          />
          <span>{label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ── QuarterTabs ─────────────────────────────────────────────────────────────────
interface QuarterTabsProps {
  activeQuarter: number;
  setActiveQuarter: (quarter: number) => void;
  quarterCounts: Record<number, number>;
}

const QuarterTabs: React.FC<QuarterTabsProps> = ({ activeQuarter, setActiveQuarter, quarterCounts }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4].map((quarter) => (
      <button
        key={quarter}
        className={cn('quarter-tab', activeQuarter === quarter && 'active')}
        onClick={() => setActiveQuarter(quarter)}
      >
        <span>T{quarter}</span>
        {quarterCounts[quarter] > 0 && (
          <span className="count">{quarterCounts[quarter]}</span>
        )}
      </button>
    ))}
  </div>
);

// ── MonthNavigation ─────────────────────────────────────────────────────────────
interface MonthNavigationProps {
  activeQuarter: number;
  selectedMonth: string | null;
  scrollToMonth: (month: string) => void;
  currentMonth: string | null;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
  activeQuarter,
  selectedMonth,
  scrollToMonth,
  currentMonth,
}) => (
  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
    {QUARTERS[activeQuarter].map((month) => {
      const isSelected = selectedMonth === month;
      const isCurrent  = currentMonth === month;
      return (
        <button
          key={month}
          className={cn(
            'relative min-w-[80px] flex-1 rounded-full border px-3 py-1.5 text-center text-[11px] font-medium transition-all',
            isSelected
              ? 'border-primary/35 bg-primary/10 text-foreground'
              : 'border-border bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground'
          )}
          onClick={() => scrollToMonth(month)}
        >
          {MONTHS_FR[month].slice(0, 4)}
          {isCurrent && (
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>
      );
    })}
  </div>
);

// ── GameItem ─────────────────────────────────────────────────────────────────────
interface GameItemProps {
  game: Game;
  formatDate: (timestamp: number) => string;
  onGameClick: (gameId: number) => void;
}

const GameItem: React.FC<GameItemProps> = ({ game, formatDate, onGameClick }) => (
  <button
    type="button"
    className="group release-item"
    onClick={() => onGameClick(game.id)}
  >
    {/* Cover */}
    <div className="h-[54px] w-[38px] flex-shrink-0 overflow-hidden rounded-[10px] border border-border bg-muted">
      <img
        src={game.cover}
        alt={game.name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>

    {/* Info */}
    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
        {game.name}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="date-chip">{formatDate(game.release_date)}</span>
        {game.platforms.slice(0, 3).map((platformId, idx) => (
          <span
            key={`${platformId}-${idx}`}
            className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-muted"
          >
            <PlatformImage platformId={platformId} alt="" size={11} />
          </span>
        ))}
        {game.platforms.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{game.platforms.length - 3}
          </span>
        )}
      </div>
    </div>

    {/* Arrow */}
    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary/70" />
  </button>
);

// ── MonthSection ─────────────────────────────────────────────────────────────────
interface MonthSectionProps {
  month: string;
  year: number;
  games: Game[];
  formatDate: (timestamp: number) => string;
  onGameClick: (gameId: number) => void;
  setRef: (el: HTMLDivElement | null) => void;
  isCurrentMonth: boolean;
}

const MonthSection: React.FC<MonthSectionProps> = ({
  month,
  year,
  games,
  formatDate,
  onGameClick,
  setRef,
  isCurrentMonth,
}) => (
  <div
    ref={setRef}
    className={cn(
      'overflow-hidden rounded-[18px] border bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)]',
      isCurrentMonth ? 'border-primary/30' : 'border-border'
    )}
  >
    {/* Month header */}
    <div className="month-header">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'font-oxanium text-xs font-black uppercase tracking-[0.2em]',
            isCurrentMonth ? 'text-primary' : 'text-muted-foreground/80'
          )}
        >
          {MONTHS_FR[month].slice(0, 4).toUpperCase()}
        </span>
        <span className="text-[11px] text-muted-foreground/40">{year}</span>
        {isCurrentMonth && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
            Maintenant
          </span>
        )}
      </div>
      <span className="count-badge">{games.length} jeu{games.length > 1 ? 'x' : ''}</span>
    </div>

    {/* Games list */}
    <div className="space-y-1.5 p-2.5">
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

// ── StatusDisplay ────────────────────────────────────────────────────────────────
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
      <div className="flex flex-col items-center gap-3 rounded-[18px] border border-border bg-muted/15 py-14">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-[13px] text-muted-foreground">Chargement du calendrier…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[18px] border border-destructive/20 bg-destructive/5 py-10 text-center">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-primary hover:underline">
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (searchTerm && !hasResults) {
    return (
      <div className="rounded-[18px] border border-border bg-muted/15 py-10 text-center text-sm text-muted-foreground">
        Aucun jeu trouvé pour &laquo;&nbsp;{searchTerm}&nbsp;&raquo;
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="rounded-[18px] border border-border bg-muted/15 py-10 text-center text-sm text-muted-foreground">
        Aucune sortie pour T{activeQuarter} {year} avec ces filtres.
      </div>
    );
  }

  return null;
};

// ── Main Component ────────────────────────────────────────────────────────────────
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

  // Dériver le mois courant
  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  // Initialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const d = new Date();
      setSelectedPlatforms([DEFAULT_PLATFORM_ID]);
      setYear(d.getFullYear());
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setSearchResults({});
      setActiveQuarter(Math.ceil((d.getMonth() + 1) / 3));
      setSelectedMonth(null);
      setCalendarGames({});
    }
  }, [isOpen]);

  // Charger les jeux
  useEffect(() => {
    if (isOpen) fetchCalendarGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedPlatforms, year]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Filtrage recherche
  useEffect(() => {
    if (debouncedSearchTerm.length < 2) { setSearchResults({}); return; }
    const results: CalendarGames = {};
    const lower = debouncedSearchTerm.toLowerCase();
    Object.keys(calendarGames).forEach((month) => {
      if (!calendarGames[month]) return;
      const matching = calendarGames[month].filter((g) => g.name.toLowerCase().includes(lower)).slice(0, 10);
      if (matching.length > 0) results[month] = matching;
    });
    setSearchResults(results);
  }, [debouncedSearchTerm, calendarGames]);

  const fetchCalendarGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const platformParams = selectedPlatforms.length > 0 ? `platforms=${selectedPlatforms.join(',')}` : '';
      const res = await fetch(`/api/calendar-games?year=${year}${platformParams ? `&${platformParams}` : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCalendarGames(await res.json());
    } catch (err) {
      console.error('Calendar error:', err);
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
    ['cameFromGames', 'cameFromHome', 'cameFromProfile', 'cameFromCollection'].forEach(
      (k) => sessionStorage.removeItem(k)
    );
    sessionStorage.setItem('cameFromCalendar', 'true');
    router.push(`/games/${gameId}`);
    onClose();
  };

  const formatDate = (timestamp: number): string =>
    new Date(timestamp * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const changeYear = (increment: number) => {
    setCalendarGames({});
    setYear((p) => p + increment);
    setActiveQuarter(1);
    setSelectedMonth(null);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSearchResults({});
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const d = touchStart - touchEnd;
    if (d > minSwipeDistance && activeQuarter < 4) setActiveQuarter((q) => q + 1);
    if (d < -minSwipeDistance && activeQuarter > 1) setActiveQuarter((q) => q - 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) =>
    setShowScrollTop(e.currentTarget.scrollTop > 300);

  const scrollToTop = () => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const filteredGames = useMemo(
    () => (debouncedSearchTerm.trim() ? searchResults : calendarGames),
    [debouncedSearchTerm, calendarGames, searchResults]
  );

  const hasGamesInQuarter = (quarter: number) =>
    QUARTERS[quarter].some((m) => filteredGames[m]?.length > 0);

  const isSearching = searchTerm.length > 0 && debouncedSearchTerm !== searchTerm;

  const visibleMonths = useMemo(
    () => MONTHS.filter((m) => (!debouncedSearchTerm ? QUARTERS[activeQuarter].includes(m) : true)),
    [activeQuarter, debouncedSearchTerm]
  );

  const visibleGamesCount = useMemo(
    () => visibleMonths.reduce((total, m) => total + (filteredGames[m]?.length || 0), 0),
    [filteredGames, visibleMonths]
  );

  // Compte par trimestre (pour les tabs)
  const quarterCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    Object.entries(QUARTERS).forEach(([q, months]) => {
      counts[Number(q)] = months.reduce((n, m) => n + (filteredGames[m]?.length || 0), 0);
    });
    return counts;
  }, [filteredGames]);

  const selectedPlatformLabel =
    PLATFORM_OPTIONS.find((p) => selectedPlatforms.includes(p.id))?.label || 'Plateforme';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calendrier des sorties"
      description="Suivez l'agenda gaming par plateforme, trimestre et mois."
      size="xxl"
      className="sm:max-w-6xl"
    >
      <div
        ref={contentRef}
        className="max-h-[80vh] space-y-4 overflow-y-auto pr-1"
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Controls panel ─────────────────────────────────── */}
        <div className="rounded-[20px] border border-border bg-gradient-to-b from-[hsl(223_26%_9%)] to-[hsl(223_30%_7%)] p-4 md:p-5">
          {/* Dot grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[20px] opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative space-y-4">
            <CalendarHeader
              year={year}
              changeYear={changeYear}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isSearching={isSearching}
              selectedPlatformLabel={selectedPlatformLabel}
              activeQuarter={activeQuarter}
              visibleGamesCount={visibleGamesCount}
            />

            <div className="section-divider" />

            <PlatformFilters
              selectedPlatforms={selectedPlatforms}
              togglePlatformFilter={togglePlatformFilter}
            />

            <div className="space-y-2.5">
              <p className="section-label">Trimestre</p>
              <QuarterTabs
                activeQuarter={activeQuarter}
                setActiveQuarter={setActiveQuarter}
                quarterCounts={quarterCounts}
              />
              <MonthNavigation
                activeQuarter={activeQuarter}
                selectedMonth={selectedMonth}
                scrollToMonth={scrollToMonth}
                currentMonth={year === currentYear ? currentMonthName : null}
              />
            </div>
          </div>
        </div>

        {/* ── Status ─────────────────────────────────────────── */}
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

        {/* ── Month grid ─────────────────────────────────────── */}
        {!loading && !error && (
          <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            {MONTHS.map((month) => {
              if (!debouncedSearchTerm && !QUARTERS[activeQuarter].includes(month)) return null;
              if (!filteredGames[month]?.length) return null;
              return (
                <MonthSection
                  key={`${year}-${month}`}
                  month={month}
                  year={year}
                  games={filteredGames[month]}
                  formatDate={formatDate}
                  onGameClick={handleGameClick}
                  setRef={(el) => { monthRefs.current[month] = el; }}
                  isCurrentMonth={year === currentYear && month === currentMonthName}
                />
              );
            })}
          </div>
        )}

        {/* ── Scroll-to-top FAB ──────────────────────────────── */}
        <div
          className={cn(
            'sticky bottom-2 flex justify-end transition-all duration-200',
            showScrollTop ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'
          )}
        >
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/90 text-white shadow-[0_8px_24px_rgba(108,68,245,0.35)] transition-transform hover:scale-105"
            onClick={scrollToTop}
            aria-label="Retour en haut"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GameCalendarModal;
