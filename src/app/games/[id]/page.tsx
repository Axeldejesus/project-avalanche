'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Gamepad2,
  Layers3,
  MessageSquareMore,
  Plus,
  ScrollText,
  Star,
  UserRound,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/EmptyState';
import GameCard from '@/components/GameCard';
import StatusBadge from '@/components/StatusBadge';
import AddToCollectionModal from '@/components/modals/AddToCollectionModal';
import LoginModal from '@/components/modals/LoginModal';
import RegisterModal from '@/components/modals/RegisterModal';
import GameVideosWrapper from '@/components/GameVideosWrapper';
import ScreenshotGallery from '@/components/ScreenshotGallery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getUserGameInCollection } from '@/services/collectionService';

const DynamicReviewForm = dynamic(() => import('@/components/ReviewForm'), {
  loading: () => <div className="text-sm text-muted-foreground">Chargement du formulaire...</div>,
  ssr: false,
});

const DynamicReviewsList = dynamic(() => import('@/components/ReviewsList'), {
  loading: () => <div className="text-sm text-muted-foreground">Chargement des reviews...</div>,
  ssr: false,
});

interface ReleaseDate {
  date: number;
  platform: string;
}

interface SimilarGame {
  id: number;
  name: string;
  cover: string;
}

interface GameDetail {
  id: number;
  name: string;
  summary: string;
  storyline?: string;
  cover: string;
  screenshots: string[];
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  releaseDates: ReleaseDate[];
  similarGames: SimilarGame[];
}

function formatReleaseDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const reviewsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState<
    'playing' | 'completed' | 'toPlay' | 'abandoned' | 'wishlist' | null
  >(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    const fetchGameDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/games/${id}`);

        if (!response.ok) {
          throw new Error('Impossible de charger les details du jeu.');
        }

        const data = await response.json();
        setGameDetail(data);
      } catch (fetchError: any) {
        setError(fetchError.message || 'Impossible de charger les details du jeu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameDetail();
  }, [id]);

  useEffect(() => {
    const syncCollectionStatus = async () => {
      if (!user) {
        setCollectionStatus(null);
        return;
      }

      const item = await getUserGameInCollection(user.uid, Number(id));
      setCollectionStatus(item?.status ?? null);
    };

    syncCollectionStatus();
  }, [id, refreshReviews, user]);

  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
      setIsRegisterModalOpen(false);
    };

    const handleOpenRegisterModal = () => {
      setIsRegisterModalOpen(true);
      setIsLoginModalOpen(false);
    };

    window.addEventListener('openLoginModal', handleOpenLoginModal as EventListener);
    window.addEventListener('openRegisterModal', handleOpenRegisterModal as EventListener);

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal as EventListener);
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal as EventListener);
    };
  }, []);

  const earliestRelease = useMemo(() => {
    if (!gameDetail?.releaseDates.length) {
      return null;
    }

    return gameDetail.releaseDates.reduce((earliest, current) =>
      current.date < earliest.date ? current : earliest
    );
  }, [gameDetail?.releaseDates]);

  const openCollectionModal = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      setIsRegisterModalOpen(false);
      return;
    }

    setIsCollectionModalOpen(true);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="surface-panel rounded-[28px] px-6 py-16 text-center text-muted-foreground">
          Chargement de la fiche jeu...
        </div>
      </AppShell>
    );
  }

  if (error || !gameDetail) {
    return (
      <AppShell>
        <EmptyState
          title="Jeu introuvable"
          description="La fiche demandee n'est pas disponible ou n'a pas pu etre chargee correctement."
          actions={<Button onClick={() => router.push('/games')}>Retour au catalogue</Button>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell contentClassName="space-y-6">
      <section className="surface-panel relative overflow-hidden rounded-[30px] p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,191,161,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(247,201,93,0.1),transparent_24%)]" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <BackButton />
            {collectionStatus ? <StatusBadge status={collectionStatus} /> : null}
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_1fr] xl:items-start">
            <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/20">
              <img src={gameDetail.cover} alt={gameDetail.name} className="h-full w-full object-cover" />
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
                  Game Detail
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  {gameDetail.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {gameDetail.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="gap-2" onClick={openCollectionModal}>
                  <Plus className="h-4 w-4" />
                  {collectionStatus ? 'Modifier dans ma collection' : 'Ajouter a ma collection'}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-white/10 bg-white/5"
                  onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <MessageSquareMore className="h-4 w-4" />
                  Aller aux reviews
                </Button>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                {gameDetail.summary}
              </p>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Premiere sortie
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {earliestRelease ? formatReleaseDate(earliestRelease.date) : 'Date inconnue'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Gamepad2 className="h-4 w-4" />
                    Plateformes
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {gameDetail.platforms.slice(0, 2).join(', ') || 'Non renseigne'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                    Developpeurs
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {gameDetail.developers.slice(0, 2).join(', ') || 'Non renseigne'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/15 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Layers3 className="h-4 w-4" />
                    Editeurs
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {gameDetail.publishers.slice(0, 2).join(', ') || 'Non renseigne'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {gameDetail.storyline ? (
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <ScrollText className="h-5 w-5 text-primary" />
              Synopsis
            </CardTitle>
            <CardDescription>
              Une lecture rapide du contexte narratif et de la proposition du jeu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <p className="text-sm leading-7 text-muted-foreground">{gameDetail.storyline}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl">Calendrier des sorties</CardTitle>
            <CardDescription>Vue compacte des sorties connues par plateforme.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {gameDetail.releaseDates.length > 0 ? (
              gameDetail.releaseDates.slice(0, 8).map((release) => (
                <div
                  key={`${release.platform}-${release.date}`}
                  className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/4 px-4 py-3"
                >
                  <span className="text-sm font-medium text-foreground">{release.platform}</span>
                  <span className="text-sm text-muted-foreground">{formatReleaseDate(release.date)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune date de sortie detaillee disponible.</p>
            )}
          </CardContent>
        </Card>

        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Star className="h-5 w-5 text-primary" />
              Identite du jeu
            </CardTitle>
            <CardDescription>Plateformes, genres et ecosysteme de production.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Genres</p>
              <p className="mt-2 text-sm text-foreground">{gameDetail.genres.join(', ') || 'Non renseigne'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plateformes</p>
              <p className="mt-2 text-sm text-foreground">{gameDetail.platforms.join(', ') || 'Non renseigne'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Developpeurs</p>
              <p className="mt-2 text-sm text-foreground">{gameDetail.developers.join(', ') || 'Non renseigne'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Editeurs</p>
              <p className="mt-2 text-sm text-foreground">{gameDetail.publishers.join(', ') || 'Non renseigne'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {gameDetail.screenshots.length > 0 ? (
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl">Captures d'ecran</CardTitle>
            <CardDescription>
              Une galerie immersive, utile pour juger l'ambiance et la direction artistique.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ScreenshotGallery screenshots={gameDetail.screenshots} gameName={gameDetail.name} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-2xl">Videos</CardTitle>
          <CardDescription>Trailers et extraits charges dynamiquement pour limiter le cout initial.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <GameVideosWrapper gameId={gameDetail.id} />
        </CardContent>
      </Card>

      {gameDetail.similarGames.length > 0 ? (
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl">Jeux similaires</CardTitle>
            <CardDescription>Des pistes immediates pour prolonger la meme vibe ou la meme boucle de jeu.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 pb-6 sm:grid-cols-2 xl:grid-cols-4">
            {gameDetail.similarGames.map((game) => (
              <GameCard
                key={game.id}
                game={{ id: game.id, name: game.name, cover: game.cover }}
                onClick={(gameId) => router.push(`/games/${gameId}`)}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div ref={reviewsRef} className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl">Ta review</CardTitle>
            <CardDescription>Ajoute une note et une impression exploitable plus tard.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <DynamicReviewForm
              gameId={gameDetail.id}
              gameName={gameDetail.name}
              gameCover={gameDetail.cover}
              onReviewSubmitted={() => setRefreshReviews((current) => current + 1)}
            />
          </CardContent>
        </Card>

        <Card className="surface-panel gap-0 rounded-[28px] border-white/8 bg-transparent py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl">Reviews joueurs</CardTitle>
            <CardDescription>Retours communautaires recents sur ce jeu.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <DynamicReviewsList gameId={gameDetail.id} refreshTrigger={refreshReviews} />
          </CardContent>
        </Card>
      </div>

      <AddToCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        gameId={gameDetail.id}
        gameName={gameDetail.name}
        gameCover={gameDetail.cover}
        onCollectionUpdated={() => setRefreshReviews((current) => current + 1)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </AppShell>
  );
}