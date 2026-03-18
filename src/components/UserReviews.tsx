'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageSquareText, Star } from 'lucide-react';
import { DocumentSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getReviewsByUser } from '../services/reviewService';
import { type Review } from '../schemas';
import FirebaseIndexHelper from './FirebaseIndexHelper';

interface UserReviewsProps {
  userId: string;
}

const UserReviews: React.FC<UserReviewsProps> = ({ userId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Cache optimisé avec Map pour meilleure performance
  const [pageCache, setPageCache] = useState<Map<number, { reviews: Review[], lastDoc?: DocumentSnapshot, hasMore: boolean }>>(new Map());
  const router = useRouter();
  
  const pageSize = 3;

  // Load initial reviews
  useEffect(() => {
    if (userId) {
      loadInitialReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadInitialReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getReviewsByUser(userId, pageSize);
      
      if (result.indexRequired) {
        setError('Database index is being created. Please wait a moment and try again.');
        return;
      }
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Initialiser le cache avec la première page
      const newCache = new Map();
      newCache.set(1, { 
        reviews: result.reviews, 
        lastDoc: result.lastDoc,
        hasMore: result.hasMore 
      });
      
      setPageCache(newCache);
      setReviews(result.reviews);
      setCurrentPage(1);
    } catch (error: any) {
      setError(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Préchargement optimisé - ne charge que si nécessaire
  const prefetchNextPage = async (pageNumber: number) => {
    if (pageCache.has(pageNumber)) return;
    
    const prevPageData = pageCache.get(pageNumber - 1);
    if (!prevPageData?.hasMore || !prevPageData.lastDoc) return;
    
    try {
      const result = await getReviewsByUser(userId, pageSize, prevPageData.lastDoc);
      
      if (!result.error && !result.indexRequired) {
        setPageCache(prev => {
          const newCache = new Map(prev);
          newCache.set(pageNumber, {
            reviews: result.reviews,
            lastDoc: result.lastDoc,
            hasMore: result.hasMore
          });
          return newCache;
        });
      }
    } catch (error) {
      console.error('Error prefetching next page:', error);
    }
  };

  const changePage = async (pageNumber: number) => {
    const cachedPage = pageCache.get(pageNumber);
    const currentPageData = pageCache.get(currentPage);
    
    // Validation de la navigation
    if (pageNumber < 1 || pageNumber === currentPage) return;
    if (pageNumber > currentPage && !currentPageData?.hasMore) return;
    
    // Utiliser le cache si disponible
    if (cachedPage) {
      setReviews(cachedPage.reviews);
      setCurrentPage(pageNumber);
      
      // Précharger la page suivante si possible
      if (cachedPage.hasMore && !pageCache.has(pageNumber + 1)) {
        prefetchNextPage(pageNumber + 1);
      }
      return;
    }

    // Charger la page si pas en cache
    setLoading(true);

    try {
      const prevPageData = pageCache.get(pageNumber - 1);
      if (!prevPageData?.lastDoc && pageNumber > 1) {
        setError('Cannot load this page. Please try going to a previous page first.');
        setLoading(false);
        return;
      }
      
      const result = await getReviewsByUser(userId, pageSize, prevPageData?.lastDoc);
      
      if (result.indexRequired || result.error) {
        setError(result.error || 'Database index is being created.');
        setLoading(false);
        return;
      }
      
      // Mettre à jour le cache et l'affichage
      setPageCache(prev => {
        const newCache = new Map(prev);
        newCache.set(pageNumber, {
          reviews: result.reviews,
          lastDoc: result.lastDoc,
          hasMore: result.hasMore
        });
        return newCache;
      });
      
      setReviews(result.reviews);
      setCurrentPage(pageNumber);
      
      // Précharger la page suivante
      if (result.hasMore) {
        prefetchNextPage(pageNumber + 1);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
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

  const navigateToGame = (gameId: number) => {
    // Effacer les flags existants pour éviter les conflits
    sessionStorage.removeItem('cameFromGames');
    sessionStorage.removeItem('cameFromHome');
    sessionStorage.removeItem('cameFromCalendar');
    // Définir le nouveau flag
    sessionStorage.setItem('cameFromProfile', 'true');
    router.push(`/games/${gameId}`);
  };

  // Génération optimisée de la pagination
  const generatePaginationNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    // Calculer le nombre total de pages basé sur le cache
    let maxKnownPage = currentPage;
    const currentPageData = pageCache.get(currentPage);
    
    if (currentPageData?.hasMore) {
      maxKnownPage = currentPage + 1;
    }
    
    // Vérifier les pages en cache
    for (let i = currentPage + 1; pageCache.has(i); i++) {
      maxKnownPage = i;
      if (pageCache.get(i)?.hasMore) {
        maxKnownPage = i + 1;
      }
    }
    
    if (maxKnownPage <= maxVisiblePages) {
      for (let i = 1; i <= maxKnownPage; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(startPage + 2, maxKnownPage - 1);
      
      if (endPage === maxKnownPage - 1) {
        startPage = Math.max(2, endPage - 2);
      }
      
      if (startPage > 2) {
        pages.push('ellipsis1');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < maxKnownPage - 1) {
        pages.push('ellipsis2');
      }
      
      pages.push(maxKnownPage);
    }
    
    return pages;
  };

  return (
    <div className="space-y-5">
      
      {error && (
        <>
          <div className="rounded-[22px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
            {error.includes('index') && (
              <p className="mt-2 text-destructive/80">L'index Firestore est encore en cours de creation.</p>
            )}
          </div>
          <FirebaseIndexHelper error={error} />
        </>
      )}
      
      {reviews.length === 0 && currentPage === 1 && !loading ? (
        <div className="rounded-[24px] border border-white/8 bg-white/4 px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/8 bg-black/20 text-muted-foreground">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">Aucune review publiee</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tes prochains avis apparaitront ici avec un acces direct a la fiche du jeu.
          </p>
        </div>
      ) : (
        <>
          {(currentPage > 1 || pageCache.get(currentPage)?.hasMore) && (
            <div className="flex flex-col gap-3 rounded-[22px] border border-white/8 bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                className="gap-2 border-white/10 bg-white/5"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </Button>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                {generatePaginationNumbers().map((page, index) => (
                  page === 'ellipsis1' || page === 'ellipsis2' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={page}
                      className={cn(
                        'flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm transition-colors',
                        currentPage === page
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-white/10 bg-black/20 text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => changePage(Number(page))}
                      disabled={loading}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <Button
                variant="outline"
                className="gap-2 border-white/10 bg-white/5"
                onClick={() => changePage(currentPage + 1)}
                disabled={!pageCache.get(currentPage)?.hasMore || loading}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className={cn('grid gap-4', loading && 'opacity-70')}>
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <button
                  key={`${review.id}-${idx}`} 
                  type="button"
                  className="rounded-[24px] border border-white/8 bg-white/4 p-4 text-left transition-colors hover:bg-white/7"
                  onClick={() => navigateToGame(review.gameId)}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <img 
                      src={review.gameCover} 
                      alt={review.gameName} 
                      className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-[18px] border border-white/8 object-cover" 
                    />
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-primary/80">Review</p>
                          <h4 className="mt-1 text-lg font-semibold text-foreground">{review.gameName}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1 rounded-full border border-white/8 bg-black/20 px-3 py-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={`star-${review.id}-${i}`}
                              className={i < review.rating ? 'h-4 w-4 text-amber-300' : 'h-4 w-4 text-muted-foreground'}
                              fill={i < review.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                          </div>
                          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Mis a jour le {formatDate(review.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-foreground/90">
                    {review.comment?.trim() || 'Aucun commentaire detaille, seulement une note.'}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-white/4 px-5 py-8 text-center text-sm text-muted-foreground">
                {loading ? 'Chargement des reviews...' : (currentPage > 1 ? 'Aucune review sur cette page. Reviens a la precedente.' : 'Aucune review publiee pour le moment.')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserReviews;
