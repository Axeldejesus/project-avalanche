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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getUserCollectionForStats } from '@/services/collectionService';

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

function formatReleaseDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

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

  useEffect(() => {
    const cameFromCalendar = sessionStorage.getItem('cameFromCalendar');
    if (cameFromCalendar === 'true') {
      setIsCalendarModalOpen(true);
      sessionStorage.removeItem('cameFromCalendar');
    }
  }, []);

  useEffect(() => {
    const loadLibrarySnapshot = async () => {
      if (!user) {
        setLibrarySnapshot(null);
        return;
      }

      setLibraryLoading(true);

      try {
        const result = await getUserCollectionForStats(user.uid);

        if (result.error) {
          setLibrarySnapshot(null);
          return;
        }

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
      } catch (libraryError) {
        console.error('Error loading library snapshot:', libraryError);
        setLibrarySnapshot(null);
      } finally {
        setLibraryLoading(false);
      }
    };

    if (!authLoading) {
      void loadLibrarySnapshot();
    }
  }, [authLoading, user]);

  const summaryMetrics = useMemo(
    () => [
      {
        label: 'Recommandations',
        value: recommendedGames.length,
        icon: Sparkles,
      },
      {
        label: 'Sorties a suivre',
        value: upcomingGames.length,
        icon: CalendarDays,
      },
      {
        label: 'Plateformes',
        value: platforms.length,
        icon: Gamepad2,
      },
    ],
    [platforms.length, recommendedGames.length, upcomingGames.length]
  );

  const navigateToGameDetail = (gameId: number) => {
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromCollection');
    sessionStorage.removeItem('cameFromCustomList');
    sessionStorage.removeItem('cameFromProfile');
    sessionStorage.setItem('cameFromHome', 'true');
    router.push(`/games/${gameId}`);
  };

  const navigateToGamesWithPlatform = (platformId: number) => {
    sessionStorage.setItem(
      'gameFilters',
      JSON.stringify({
        platforms: [platformId],
        genres: [],
        releaseYear: null,
        searchQuery: '',
        releaseStatus: 'all',
        sort: 'default',
      })
    );
    router.push('/games');
  };

  const navigateToNewReleases = () => {
    sessionStorage.setItem(
      'gameFilters',
      JSON.stringify({
        platforms: [],
        genres: [],
        releaseYear: null,
        searchQuery: '',
        releaseStatus: 'released',
        sort: 'release_desc',
      })
    );
    router.push('/games');
  };

  const navigateToGames = () => {
    sessionStorage.removeItem('gameFilters');
    router.push('/games');
  };

  const librarySegments = librarySnapshot
    ? [
        { key: 'playing', label: 'En cours', value: librarySnapshot.playing },
        { key: 'completed', label: 'Terminés', value: librarySnapshot.completed },
        { key: 'toPlay', label: 'Backlog', value: librarySnapshot.toPlay },
        { key: 'wishlist', label: 'Wishlist', value: librarySnapshot.wishlist },
      ]
    : [];

  return (
    <AppShell contentClassName="space-y-6">
      <PageIntro
        eyebrow="Dashboard"
        title="Une bibliotheque gaming qui reste lisible, meme quand ton backlog explose."
        description="Avalanche centralise tes jeux a suivre, tes sorties prioritaires et tes prochaines sessions dans une interface sombre, dense et claire."
        actions={
          <>
            <Button className="gap-2" onClick={() => router.push('/collections')}>
              <Library className="h-4 w-4" />
              Ouvrir ma bibliotheque
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 hover:bg-white/8"
              onClick={() => setIsAboutModalOpen(true)}
            >
              <Info className="h-4 w-4" />
              A propos
            </Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {summaryMetrics.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-[22px] border border-white/8 bg-black/15 px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </PageIntro>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Library className="h-5 w-5" />
              </span>
              Coup d'oeil sur ma bibliotheque
            </CardTitle>
            <CardDescription>
              Un résumé rapide de tes jeux suivis, directement depuis l'accueil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            {authLoading || libraryLoading ? (
              <div className="grid gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-[20px] bg-white/6" />
                ))}
              </div>
            ) : librarySnapshot ? (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">{librarySnapshot.total}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">En cours</p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">{librarySnapshot.playing}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Terminés</p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">{librarySnapshot.completed}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Backlog</p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">{librarySnapshot.toPlay}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Répartition rapide</p>
                    <Button variant="ghost" className="h-auto px-0 text-primary" onClick={() => router.push('/collections')}>
                      Voir la bibliotheque
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-full border border-white/8 bg-black/20">
                    <div className="flex h-3 w-full overflow-hidden rounded-full">
                      {librarySegments.map((segment) => {
                        const width = librarySnapshot.total > 0 ? (segment.value / librarySnapshot.total) * 100 : 0;

                        if (width === 0) {
                          return null;
                        }

                        const colorClass =
                          segment.key === 'playing'
                            ? 'bg-emerald-400/80'
                            : segment.key === 'completed'
                              ? 'bg-cyan-400/80'
                              : segment.key === 'toPlay'
                                ? 'bg-amber-400/80'
                                : 'bg-fuchsia-400/80';

                        return <div key={segment.key} className={colorClass} style={{ width: `${width}%` }} />;
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {librarySegments.map((segment) => (
                      <div key={segment.key} className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                        {segment.label} · {segment.value}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Bibliotheque non disponible"
                description={user ? 'Ajoute quelques jeux a ta collection pour faire apparaitre un vrai tableau de bord ici.' : 'Connecte-toi pour afficher une vue rapide de ta bibliotheque depuis l’accueil.'}
                actions={
                  <Button onClick={() => router.push(user ? '/collections' : '/profile')}>
                    {user ? 'Remplir ma bibliotheque' : 'Ouvrir mon profil'}
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl">Récemment suivis</CardTitle>
            <CardDescription>Les derniers jeux présents dans ta collection personnelle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {librarySnapshot?.recentItems?.length ? (
              librarySnapshot.recentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToGameDetail(item.gameId)}
                  className="flex w-full items-center gap-3 rounded-[20px] border border-white/8 bg-white/4 p-3 text-left transition-colors hover:bg-white/8"
                >
                  <img src={item.gameCover} alt={item.gameName} className="h-16 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.gameName}</p>
                    <div className="mt-2">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-black/15 p-6 text-sm text-muted-foreground">
                Aucun jeu récent à afficher pour le moment.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Recommandes pour toi"
          description="Une selection premium pour alimenter ta prochaine session."
          action={
            <Button variant="ghost" className="gap-2 text-primary" onClick={navigateToGames}>
              Explorer le catalogue
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />

        {recommendedGames.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recommendedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucune recommandation disponible"
            description="Les recommandations reviendront des que le catalogue aura ete charge correctement."
          />
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
              Lancement radar
            </CardTitle>
            <CardDescription>
              Les prochaines sorties a fort potentiel, avec leurs fenetres de sortie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {upcomingGames.length > 0 ? (
              upcomingGames.slice(0, 5).map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => navigateToGameDetail(game.id)}
                  className="flex w-full items-center gap-4 rounded-[22px] border border-white/8 bg-white/4 p-3 text-left transition-colors hover:bg-white/8"
                >
                  <img
                    src={game.cover}
                    alt={game.name}
                    className="h-20 w-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{game.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-primary/80">
                          {formatReleaseDate(game.release_date)}
                        </p>
                      </div>
                      {game.rating ? (
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-xs text-amber-200">
                          <Trophy className="h-3 w-3" />
                          {game.rating.toFixed(1)}
                        </div>
                      ) : null}
                    </div>
                    {game.genres ? (
                      <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{game.genres}</p>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <EmptyState
                title="Aucune sortie a venir"
                description="Le calendrier reviendra ici des que des dates de sorties seront disponibles."
              />
            )}

            <Button
              variant="outline"
              className="w-full border-white/10 bg-white/5 hover:bg-white/8"
              onClick={() => setIsCalendarModalOpen(true)}
            >
              Voir le calendrier complet
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-xl">Nouvelles sorties</CardTitle>
              <CardDescription>Les derniers jeux ajoutes au radar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6">
              {newReleaseGames.length > 0 ? (
                newReleaseGames.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => navigateToGameDetail(game.id)}
                    className="flex w-full items-center gap-3 rounded-[20px] border border-white/8 bg-white/4 p-3 text-left transition-colors hover:bg-white/8"
                  >
                    <img
                      src={game.cover}
                      alt={game.name}
                      className="h-16 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">{game.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatReleaseDate(game.release_date)}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-xs text-amber-200">
                      {game.rating.toFixed(1)}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucune sortie recente disponible.</p>
              )}

              <Button
                variant="ghost"
                className="w-full justify-between px-0 text-primary"
                onClick={navigateToNewReleases}
              >
                Voir toutes les sorties recentes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-xl">Explorer par plateforme</CardTitle>
              <CardDescription>Accede directement aux jeux de ton ecosysteme favori.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 px-6 pb-6">
              {platforms.length > 0 ? (
                platforms.slice(0, 6).map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => navigateToGamesWithPlatform(platform.id)}
                    className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/4 p-3 text-left transition-colors hover:bg-white/8"
                  >
                    <PlatformImage
                      platformId={platform.id}
                      platformName={platform.name}
                      src={platform.icon}
                      alt={platform.name}
                      className="h-6 w-6 object-contain opacity-85"
                      size={24}
                    />
                    <span className="text-sm font-medium text-foreground">{platform.name}</span>
                  </button>
                ))
              ) : (
                <div className="col-span-2 text-sm text-muted-foreground">
                  Aucune plateforme disponible pour le moment.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <GameCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </AppShell>
  );
}