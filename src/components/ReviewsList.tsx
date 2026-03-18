'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageSquareText, Star } from 'lucide-react';
import { DocumentSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { getReviewsByGame } from '../services/reviewService';
import { type Review } from '../schemas';
import FirebaseIndexHelper from './FirebaseIndexHelper';
import UserAvatar from './UserAvatar';

interface ReviewsListProps {
  gameId: number;
  refreshTrigger?: number; // Utilisé pour déclencher un rafraîchissement de la liste
}

const ReviewsList: React.FC<ReviewsListProps> = ({ gameId, refreshTrigger = 0 }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  // Cache optimisé
  const [pageCache, setPageCache] = useState<Map<number, { reviews: Review[], lastDoc?: DocumentSnapshot, hasMore: boolean }>>(new Map());
  const pageSize = 5;

  const loadReviews = async (reset = false, targetPage?: number) => {
    // Utiliser le cache si disponible et pas de reset
    if (!reset && targetPage && pageCache.has(targetPage)) {
      const cached = pageCache.get(targetPage)!;
      setReviews(cached.reviews);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const pageToLoad = reset ? 1 : (targetPage || page);
      const prevPageData = reset ? undefined : pageCache.get(pageToLoad - 1);
      
      const result = await getReviewsByGame(
        gameId, 
        pageSize, 
        reset ? undefined : prevPageData?.lastDoc
      );
      
      if (result.indexRequired) {
        setError('Database index is being created. Please wait a moment and try again.');
        return;
      }
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (reset) {
        // Réinitialiser complètement le cache
        const newCache = new Map();
        newCache.set(1, {
          reviews: result.reviews,
          lastDoc: result.lastDoc,
          hasMore: result.hasMore
        });
        setPageCache(newCache);
      } else {
        // Ajouter au cache
        setPageCache(prev => {
          const newCache = new Map(prev);
          newCache.set(pageToLoad, {
            reviews: result.reviews,
            lastDoc: result.lastDoc,
            hasMore: result.hasMore
          });
          return newCache;
        });
      }
      
      setReviews(result.reviews);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      
      if (error.message && error.message.includes('permission')) {
        setError('Unable to load reviews due to permission settings. Please try again later.');
      } else if (error.message && error.message.includes('index')) {
        setError('Database index is being created. Please wait a moment and try again.');
      } else {
        setError(error.message || 'Failed to load reviews');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageCache(new Map());
    loadReviews(true);
    setPage(1);
  }, [gameId, refreshTrigger]);

  const handleNextPage = () => {
    const currentPageData = pageCache.get(page);
    if (!currentPageData?.hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    
    if (pageCache.has(nextPage)) {
      const cached = pageCache.get(nextPage)!;
      setReviews(cached.reviews);
    } else {
      loadReviews(false, nextPage);
    }
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    
    const prevPage = page - 1;
    setPage(prevPage);
    
    const cached = pageCache.get(prevPage);
    if (cached) {
      setReviews(cached.reviews);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 border-b border-white/8 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Communaute</p>
        <h3 className="text-2xl font-semibold text-foreground">Avis des joueurs</h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Retours recents, notes syntheses et commentaires detailles sur cette fiche.
        </p>
      </div>
      
      {error && (
        <>
          <div className="rounded-[22px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
            {error.includes('index') && (
              <p className="mt-2 text-destructive/80">L'index Firestore est encore en cours de creation.</p>
            )}
            {error.includes('permissions') && (
              <p className="mt-2 text-destructive/80">Probleme de permissions. Contacte l'administrateur du site.</p>
            )}
          </div>
          <FirebaseIndexHelper error={error} />
        </>
      )}
      
      {reviews.length === 0 ? (
        <div className="rounded-[24px] border border-white/8 bg-white/4 px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/8 bg-black/20 text-muted-foreground">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">
            {loading ? 'Chargement des avis...' : 'Aucun avis pour le moment'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {loading ? 'La liste se remplit.' : 'Sois le premier a donner le ton sur ce jeu.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <article key={`${review.id}-${idx}`} className="rounded-[24px] border border-white/8 bg-white/4 p-5 transition-colors hover:bg-white/6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar username={review.username} imageUrl={review.userProfileImage} size="medium" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.username}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Publie le {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/8 bg-black/20 px-3 py-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={`star-${review.id}-${i}`}
                        className={i < review.rating ? 'h-4 w-4 text-amber-300' : 'h-4 w-4 text-muted-foreground'}
                        fill={i < review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-6 text-foreground/90">
                    {review.comment?.trim() || 'Aucun commentaire detaille, seulement une note.'}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {review.updatedAt !== review.createdAt
                      ? `Modifie le ${formatDate(review.updatedAt)}`
                      : 'Version originale'}
                  </p>
                </div>
              </article>
            ))}
          </div>
          
          {(page > 1 || pageCache.get(page)?.hasMore) && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-4 sm:flex-row">
              <Button
                variant="outline"
                className="gap-2 border-white/10 bg-white/5"
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </Button>
              
              <span className="text-sm text-muted-foreground">Page {page}</span>
              
              <Button
                variant="outline"
                className="gap-2 border-white/10 bg-white/5"
                onClick={handleNextPage}
                disabled={!pageCache.get(page)?.hasMore || loading}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
      
      {loading && reviews.length > 0 && (
        <div className="text-sm text-muted-foreground">Chargement des avis supplementaires...</div>
      )}
    </div>
  );
};

export default ReviewsList;
