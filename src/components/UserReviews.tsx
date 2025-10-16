'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiStar } from 'react-icons/fi';
import { DocumentSnapshot } from 'firebase/firestore';
import { getReviewsByUser } from '../services/reviewService';
import { type Review } from '../schemas';
import FirebaseIndexHelper from './FirebaseIndexHelper';
import styles from '../styles/UserReviews.module.css';

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
    return date.toLocaleDateString('en-US', {
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
    <div className={styles.userReviewsContainer}>
      <h3 className={styles.userReviewsTitle}>Your Game Reviews</h3>
      
      {error && (
        <>
          <div className={styles.userReviewsError}>
            <p>{error}</p>
            {error.includes('index') && (
              <p>This is a one-time setup issue. The system is creating necessary database indexes.</p>
            )}
          </div>
          <FirebaseIndexHelper error={error} />
        </>
      )}
      
      {reviews.length === 0 && currentPage === 1 && !loading ? (
        <div className={styles.noReviews}>
          You haven't reviewed any games yet.
        </div>
      ) : (
        <>
          {/* Pagination moved to top - Afficher seulement s'il y a plus d'une page */}
          {(currentPage > 1 || pageCache.get(currentPage)?.hasMore) && (
            <div className={styles.userReviewsPagination}>
              <button 
                className={`${styles.paginationButton} ${styles.navButton}`}
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Prev
              </button>
              
              <div className={styles.paginationNumbers}>
                {generatePaginationNumbers().map((page, index) => (
                  page === 'ellipsis1' || page === 'ellipsis2' ? (
                    <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>...</span>
                  ) : (
                    <button
                      key={page}
                      className={`${styles.paginationNumber} ${currentPage === page ? styles.activePage : ''}`}
                      onClick={() => changePage(Number(page))}
                      disabled={loading}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <button 
                className={`${styles.paginationButton} ${styles.navButton}`}
                onClick={() => changePage(currentPage + 1)}
                disabled={!pageCache.get(currentPage)?.hasMore || loading}
              >
                Next
              </button>
            </div>
          )}
          
          <div className={`${styles.userReviewsList} ${loading ? styles.fadedContent : ''}`}>
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <div 
                  key={`${review.id}-${idx}`} 
                  className={styles.userReviewItem}
                  onClick={() => navigateToGame(review.gameId)}
                >
                  <div className={styles.userReviewGameInfo}>
                    <img 
                      src={review.gameCover} 
                      alt={review.gameName} 
                      className={styles.gameCover} 
                    />
                    <div className={styles.gameDetails}>
                      <h4 className={styles.gameName}>{review.gameName}</h4>
                      <div className={styles.ratingDate}>
                        <div className={styles.reviewRating}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FiStar
                              key={`star-${review.id}-${i}`}
                              className={i < review.rating ? styles.starFilled : styles.star}
                              fill={i < review.rating ? '#FFD700' : 'none'}
                            />
                          ))}
                        </div>
                        <span className={styles.reviewDate}>
                          {formatDate(review.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.reviewComment}>{review.comment}</p>
                </div>
              ))
            ) : (
              <div className={styles.noReviews}>
                {loading ? 'Loading reviews...' : (currentPage > 1 ? 'No reviews on this page. Please go back to the previous page.' : 'You haven\'t reviewed any games yet.')}
              </div>
            )}
            
            {loading && (
              <div className={styles.overlayLoading}>
                <div className={styles.loadingSpinner}></div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserReviews;
