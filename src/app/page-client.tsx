"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Gamepad2,
  Info,
  Library,
  Sparkles,
  Trophy,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import GameCard from '@/components/GameCard';
import PageIntro from '@/components/PageIntro';
import PlatformImage from '@/components/PlatformImage';
import StatusBadge from '@/components/StatusBadge';
import AboutModal from '@/components/modals/AboutModal';
import GameCalendarModal from '@/components/modals/GameCalendarModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getUserCollectionForStats } from '@/services/collectionService';
import { cn } from '@/lib/utils';

/* ── Types ──────────────────────────────────────────────────── */
interface Game {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres?: string;
}

interface NewReleaseGame {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  rating: number;
}

interface UpcomingGame {
  id: number;
  name: string;
  cover: string;
  release_date: number;
  genres?: string;
  rating?: number;
}

interface Platform {
  id: number;
  name: string;
  icon: string;
}

interface HomePageProps {
  recommendedGames: Game[];
  upcomingGames: UpcomingGame[];
  newReleaseGames: NewReleaseGame[];
  platforms: Platform[];
}

interface LibraryPreviewItem {
  id: string;
  gameId: number;
  gameName: string;
  gameCover: string;
  status: 'playing' | 'completed' | 'toPlay' | 'abandoned' | 'wishlist';
}

interface LibrarySnapshot {
  total: number;
  completed: number;
  playing: number;
  toPlay: number;
  abandoned: number;
  wishlist: number;
  recentItems: LibraryPreviewItem[];
}

/* ── Helpers ─────────────────────────────────────────────────── */
function formatReleaseDate(timestamp: number): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp * 1000));
}

/**
 * SectionHeader VOID PROTOCOL
 * index : numérotation éditoriale (ex: "01")
 */
function SectionHeader({
  title,
  description,
  action,
  index,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  index?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {index && (
          <span className="mt-1 shrink-0 font-oxanium text-[11px] font-black tracking-[0.22em] text-primary/45">
            {index}
          </span>
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-[22px]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Panel section — remplace les Card shadcn pour plus de contrôle */
function SectionPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[22px] border border-border',
        'bg-gradient-to-b from-[hsl(223_26%_8.5%)] to-[hsl(223_30%_7%)]',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── Composant principal ─────────────────────────────────────── */
export default function HomePage({
  recommendedGames,
  upcomingGames,
  newReleaseGames,
  platforms,
}: HomePageProps) {
  const { user, loading: authLoading } = useAuth();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [librarySnapshot, setLibrarySnapshot] = useState<LibrarySnapshot | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const router = useRouter();

  /* Restauration du calendrier depuis sessionStorage */
  useEffect(() => {
    if (sessionStorage.getItem('cameFromCalendar') === 'true') {
      setIsCalendarModalOpen(true);
      sessionStorage.removeItem('cameFromCalendar');
    }
  }, []);

  /* Chargement de la snapshot bibliothèque */
  useEffect(() => {
    const load = async () => {
      if (!user) { setLibrarySnapshot(null); return; }
      setLibraryLoading(true);
      try {
        const result = await getUserCollectionForStats(user.uid);
        if (result.error) { setLibrarySnapshot(null); return; }
        setLibrarySnapshot({
          ...result.stats,
          recentItems: result.items.slice(0, 3).map((item) => ({
            id: item.id || String(item.gameId),
            gameId: item.gameId,
            gameName: item.gameName,
            gameCover: item.gameCover,
            status: item.status as LibraryPreviewItem['status'],
          })),
        });
      } catch (err) {
        console.error('Error loading library snapshot:', err);
        setLibrarySnapshot(null);
      } finally {
        setLibraryLoading(false);
      }
    };
    if (!authLoading) void load();
  }, [authLoading, user]);

  const summaryMetrics = useMemo(
    () => [
      { label: 'Recommandations', value: recommendedGames.length, icon: Sparkles },
      { label: 'Sorties à suivre',  value: upcomingGames.length,   icon: CalendarDays },
      { label: 'Plateformes',       value: platforms.length,        icon: Gamepad2 },
    ],
    [platforms.length, recommendedGames.length, upcomingGames.length]
  );

  /* Handlers de navigation */
  const navigateToGameDetail = (gameId: number) => {
    ['cameFromGames','cameFromCollection','cameFromCustomList','cameFromProfile'].forEach((k) =>
      sessionStorage.removeItem(k)
    );
    sessionStorage.setItem('cameFromHome', 'true');
    router.push(`/games/${gameId}`);
  };

  const navigateToGamesWithPlatform = (platformId: number) => {
    sessionStorage.setItem('gameFilters', JSON.stringify({
      platforms: [platformId], genres: [], releaseYear: null,
      searchQuery: '', releaseStatus: 'all', sort: 'default',
    }));
    router.push('/games');
  };

  const navigateToNewReleases = () => {
    sessionStorage.setItem('gameFilters', JSON.stringify({
      platforms: [], genres: [], releaseYear: null,
      searchQuery: '', releaseStatus: 'released', sort: 'release_desc',
    }));
    router.push('/games');
  };

  const navigateToGames = () => { sessionStorage.removeItem('gameFilters'); router.push('/games'); };

  const librarySegments = librarySnapshot
    ? [
        { key: 'playing',   label: 'En cours',  value: librarySnapshot.playing,   color: 'bg-emerald-400' },
        { key: 'completed', label: 'Terminés',   value: librarySnapshot.completed, color: 'bg-cyan-400'    },
        { key: 'toPlay',    label: 'Backlog',    value: librarySnapshot.toPlay,    color: 'bg-amber-400'   },
        { key: 'wishlist',  label: 'Wishlist',   value: librarySnapshot.wishlist,  color: 'bg-fuchsia-400' },
      ]
    : [];

  /* ── Rendu ─────────────────────────────────────────────────── */
  return (
    <AppShell contentClassName="space-y-8">

      {/* ══ HERO BANNER ════════════════════════════════════════ */}
      <PageIntro
        eyebrow="Dashboard"
        title="Une bibliothèque gaming lisible, même quand le backlog explose."
        description="Avalanche centralise tes jeux à suivre, tes sorties prioritaires et tes prochaines sessions — dans une interface sombre, dense et claire."
        actions={
          <>
            <Button className="gap-2" onClick={() => router.push('/collections')}>
              <Library className="h-4 w-4" />
              Ma bibliothèque
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-border bg-muted/50 hover:bg-muted hover:border-primary/30"
              onClick={() => setIsAboutModalOpen(true)}
            >
              <Info className="h-4 w-4" />
              À propos
            </Button>
          </>
        }
      >
        {/* Tuiles métriques */}
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryMetrics.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="stat-chip flex items-center justify-between px-4 py-4"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 font-oxanium text-3xl font-black tabular-nums text-foreground">
                  {value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </PageIntro>

      {/* ══ BIBLIOTHÈQUE + RÉCEMMENT SUIVIS ════════════════════ */}
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Snapshot bibliothèque */}
        <SectionPanel>
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Library className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">Coup d'œil sur ma bibliothèque</h2>
                <p className="text-xs text-muted-foreground">Résumé de ta collection depuis l'accueil</p>
              </div>
            </div>
          </div>
          <div className="space-y-5 px-6 pb-6 pt-5">
            {authLoading || libraryLoading ? (
              <div className="grid gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted/50" />
                ))}
              </div>
            ) : librarySnapshot ? (
              <>
                {/* Stat tiles */}
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                  {[
                    { label: 'Total',    value: librarySnapshot.total     },
                    { label: 'En cours', value: librarySnapshot.playing   },
                    { label: 'Terminés', value: librarySnapshot.completed },
                    { label: 'Backlog',  value: librarySnapshot.toPlay    },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1.5 font-oxanium text-2xl font-black tabular-nums text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Répartition */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Répartition
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/collections')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Voir la bibliothèque
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Barre de progression segmentée */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border">
                    <div className="flex h-full w-full">
                      {librarySegments.map((seg) => {
                        const w = librarySnapshot.total > 0
                          ? (seg.value / librarySnapshot.total) * 100
                          : 0;
                        if (w === 0) return null;
                        return (
                          <div
                            key={seg.key}
                            className={cn('h-full transition-all', seg.color)}
                            style={{ width: `${w}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {librarySegments.map((seg) => (
                      <span
                        key={seg.key}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground"
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', seg.color)} />
                        {seg.label} · <span className="tabular-nums text-foreground/80">{seg.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Bibliothèque non disponible"
                description={
                  user
                    ? 'Ajoute des jeux à ta collection pour voir un tableau de bord ici.'
                    : "Connecte-toi pour afficher ta bibliothèque depuis l'accueil."
                }
                actions={
                  <Button onClick={() => router.push(user ? '/collections' : '/profile')}>
                    {user ? 'Remplir ma bibliothèque' : 'Se connecter'}
                  </Button>
                }
              />
            )}
          </div>
        </SectionPanel>

        {/* Récemment suivis */}
        <SectionPanel>
          <div className="px-6 pt-6">
            <h2 className="text-lg font-bold text-foreground">Récemment suivis</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Les derniers jeux présents dans ta collection.</p>
          </div>
          <div className="space-y-2 px-4 pb-5 pt-4">
            {librarySnapshot?.recentItems?.length ? (
              librarySnapshot.recentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToGameDetail(item.gameId)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/25 p-3 text-left transition-all hover:border-primary/25 hover:bg-primary/5"
                >
                  <img
                    src={item.gameCover}
                    alt={item.gameName}
                    className="h-16 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                      {item.gameName}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/15 p-6 text-center text-sm text-muted-foreground">
                Aucun jeu récent à afficher.
              </div>
            )}
          </div>
        </SectionPanel>
      </section>

      {/* ══ RECOMMANDATIONS ════════════════════════════════════ */}
      <section className="space-y-5">
        <SectionHeader
          index="01"
          title="Recommandés pour toi"
          description="Une sélection premium pour alimenter ta prochaine session."
          action={
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:text-primary/80 hover:bg-primary/8"
              onClick={navigateToGames}
            >
              Explorer le catalogue
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
        <div className="section-divider" />

        {recommendedGames.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recommendedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucune recommandation disponible"
            description="Les recommandations reviendront dès que le catalogue aura été chargé correctement."
          />
        )}
      </section>

      {/* ══ RADAR + NOUVELLES SORTIES + PLATEFORMES ════════════ */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.95fr]">

        {/* Lancement Radar */}
        <SectionPanel>
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">Lancement Radar</h2>
                <p className="text-xs text-muted-foreground">Prochaines sorties à fort potentiel</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4 pt-4">
            {upcomingGames.length > 0 ? (
              upcomingGames.slice(0, 5).map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => navigateToGameDetail(game.id)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-muted/25 p-3 text-left transition-all hover:border-primary/25 hover:bg-primary/5"
                >
                  <img
                    src={game.cover}
                    alt={game.name}
                    className="h-[72px] w-[52px] shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                          {game.name}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">
                          {formatReleaseDate(game.release_date)}
                        </p>
                      </div>
                      {game.rating ? (
                        <div className="score-badge shrink-0 px-2 py-0.5 text-[11px]">
                          {game.rating.toFixed(1)}
                        </div>
                      ) : null}
                    </div>
                    {game.genres && (
                      <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">{game.genres}</p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <EmptyState
                title="Aucune sortie à venir"
                description="Le calendrier reviendra ici dès que des dates seront disponibles."
              />
            )}

            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/5"
              onClick={() => setIsCalendarModalOpen(true)}
            >
              Voir le calendrier complet
            </Button>
          </div>
        </SectionPanel>

        {/* Colonne droite : nouvelles sorties + plateformes */}
        <div className="space-y-5">

          {/* Nouvelles sorties */}
          <SectionPanel>
            <div className="px-6 pt-5">
              <h2 className="text-base font-bold text-foreground">Nouvelles sorties</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Les derniers jeux ajoutés au radar.</p>
            </div>
            <div className="space-y-2 px-4 pb-4 pt-3">
              {newReleaseGames.length > 0 ? (
                newReleaseGames.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => navigateToGameDetail(game.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/25 p-2.5 text-left transition-all hover:border-primary/25 hover:bg-primary/5"
                  >
                    <img
                      src={game.cover}
                      alt={game.name}
                      className="h-14 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                        {game.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatReleaseDate(game.release_date)}
                      </p>
                    </div>
                    <div className="score-badge shrink-0 px-2 py-0.5 text-[10px]">
                      {game.rating.toFixed(1)}
                    </div>
                  </button>
                ))
              ) : (
                <p className="py-2 text-center text-sm text-muted-foreground">Aucune sortie récente.</p>
              )}

              <button
                type="button"
                onClick={navigateToNewReleases}
                className="mt-1 flex w-full items-center justify-between px-1 py-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Voir toutes les sorties récentes
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </SectionPanel>

          {/* Explorer par plateforme */}
          <SectionPanel>
            <div className="px-6 pt-5">
              <h2 className="text-base font-bold text-foreground">Explorer par plateforme</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Accède directement à ton écosystème favori.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-3">
              {platforms.length > 0 ? (
                platforms.slice(0, 6).map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => navigateToGamesWithPlatform(platform.id)}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/25 px-3 py-2.5 text-left transition-all hover:border-primary/25 hover:bg-primary/5"
                  >
                    <PlatformImage
                      platformId={platform.id}
                      platformName={platform.name}
                      src={platform.icon}
                      alt={platform.name}
                      className="h-5 w-5 shrink-0 object-contain opacity-80"
                      size={20}
                    />
                    <span className="truncate text-[12px] font-medium text-foreground">
                      {platform.name}
                    </span>
                  </button>
                ))
              ) : (
                <p className="col-span-2 text-sm text-muted-foreground">
                  Aucune plateforme disponible.
                </p>
              )}
            </div>
          </SectionPanel>
        </div>
      </section>

      {/* Modals */}
      <GameCalendarModal isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)} />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </AppShell>
  );
}
