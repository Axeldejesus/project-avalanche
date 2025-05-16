'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiStar } from 'react-icons/fi';
import { DocumentSnapshot } from 'firebase/firestore';
import { getReviewsByUser, Review } from '../services/reviewService';
import FirebaseIndexHelper from './FirebaseIndexHelper';
import styles from '../styles/UserReviews.module.css';

interface UserReviewsProps {
  userId: string;
}

const UserReviews: React.FC<UserReviewsProps> = ({ userId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageReviews, setPageReviews] = useState<{ [key: number]: Review[] }>({});
  const [pageLastDocs, setPageLastDocs] = useState<{ [key: number]: DocumentSnapshot | undefined }>({});
  const router = useRouter();
  
  const pageSize = 3; // Nombre de reviews par page

  // Load initial reviews
  useEffect(() => {
    if (userId) {
      loadInitialReviews();
    }
  }, [userId]);

  const loadInitialReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getReviewsByUser(userId, pageSize);
      
      if (result.indexRequired) {
        setError('Database index is being created. Please wait a moment and try again.');
        console.log('Please create the required index using the link in the console error message.');
        return;
      }
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Store the reviews for page 1
      setPageReviews({ 1: result.reviews });
      setReviews(result.reviews);
      
      // Store the last document for pagination if it exists
      if (result.lastDoc) {
        setPageLastDocs({ 1: result.lastDoc });
      }
      
      // Only set totalPages > 1 if we have exactly pageSize reviews AND hasMore is true
      // This means we're certain there are more reviews to fetch
      if (result.hasMore && result.reviews.length === pageSize) {
        setTotalPages(2); // Set exactly to 2 as we know there's at least a second page
      } else {
        setTotalPages(1); // Otherwise, just one page
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fetch the next page of reviews if it doesn't exist in cache
  const prefetchNextPage = async (pageNumber: number) => {
    // Don't prefetch if we already have this page's reviews
    if (pageReviews[pageNumber]) return;
    
    // Don't prefetch beyond the known total pages
    if (pageNumber > totalPages) return;
    
    // Get the last document from the previous page
    const lastDoc = pageLastDocs[pageNumber - 1];
    if (!lastDoc) return;
    
    try {
      const result = await getReviewsByUser(userId, pageSize, lastDoc);
      
      if (result.error || result.indexRequired) return;
      
      // Store the reviews for this page
      setPageReviews(prev => ({ ...prev, [pageNumber]: result.reviews }));
      
      // Store the last document for further pagination
      if (result.lastDoc) {
        setPageLastDocs(prev => ({ ...prev, [pageNumber]: result.lastDoc }));
      }
      
      // Only increment total pages if we have a full page AND hasMore is true
      // This confirms there are actually more pages after this one
      if (result.hasMore && result.reviews.length === pageSize && pageNumber >= totalPages) {
        setTotalPages(pageNumber + 1); // Set to exactly next page number
      }
    } catch (error) {
      console.error('Error prefetching next page:', error);
    }
  };

  // Handle page change
  const changePage = async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
    
    // Show loading only if we don't have cached reviews for this page
    if (!pageReviews[pageNumber]) {
      setLoading(true);
    }

    try {
      // If we already have the reviews for this page, use them
      if (pageReviews[pageNumber]) {
        setReviews(pageReviews[pageNumber]);
        setCurrentPage(pageNumber);
        
        // If this page exists but is empty, adjust the total number of pages
        if (pageReviews[pageNumber].length === 0) {
          setTotalPages(pageNumber - 1);
          changePage(pageNumber - 1);
          return;
        }
        
        // Only try to prefetch the next page if we have a full page of reviews
        // This prevents creating phantom pages when we're on the last real page
        if (pageReviews[pageNumber].length === pageSize) {
          prefetchNextPage(pageNumber + 1);
        }
        return;
      }
      
      const lastDoc = pageLastDocs[pageNumber - 1];
      if (!lastDoc && pageNumber > 1) {
        setError('Cannot load this page. Please try going to a previous page first.');
        return;
      }
      
      const result = await getReviewsByUser(userId, pageSize, lastDoc);
      
      if (result.indexRequired) {
        setError('Database index is being created. Please wait a moment and try again.');
        return;
      }
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Si nous avons obtenu une page vide, ajuster le nombre de pages et retourner à la page précédente
      if (result.reviews.length === 0 && pageNumber > 1) {
        // Cache quand même cette page vide
        setPageReviews(prev => ({ ...prev, [pageNumber]: [] }));
        // Ajuster le nombre total de pages
        setTotalPages(pageNumber - 1);
        // Retourner à la dernière page valide
        changePage(pageNumber - 1);
        return;
      }
      
      // Update reviews display
      setReviews(result.reviews);
      
      // Cache the reviews for this page
      setPageReviews(prev => ({ ...prev, [pageNumber]: result.reviews }));
      
      // Store the last document for pagination, ensuring it's safe for the type
      if (result.lastDoc) {
        setPageLastDocs(prev => ({ ...prev, [pageNumber]: result.lastDoc }));
      }
      
      // Update current page
      setCurrentPage(pageNumber);
      
      // Only increase total pages if:
      // 1. We have more reviews according to hasMore flag
      // 2. AND this page has exactly pageSize reviews (it's a full page)
      // 3. AND we've verified by actually attempting to load the next page
      if (result.hasMore && result.reviews.length === pageSize && pageNumber >= totalPages) {
        // Attempt to actually load one item from the next page to confirm it exists
        // before increasing the page count
        const nextPageCheckResult = await getReviewsByUser(userId, 1, result.lastDoc);
        if (nextPageCheckResult.reviews.length > 0) {
          setTotalPages(pageNumber + 1);
        }
      }
      
      // Only prefetch next page if this page is full
      if (result.reviews.length === pageSize) {
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

  // Generate pagination numbers
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if we have fewer than maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include page 1
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(startPage + 2, totalPages - 1);
      
      // Adjust if we're near the end
      if (endPage === totalPages - 1) {
        startPage = Math.max(2, endPage - 2);
      }
      
      // Add ellipsis after page 1 if needed
      if (startPage > 2) {
        pages.push('ellipsis1');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis2');
      }
      
      // Always include last page
      pages.push(totalPages);
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
          <div className={`${styles.userReviewsList} ${loading ? styles.fadedContent : ''}`}>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div 
                  key={review.id} 
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
                              key={i}
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
          
          {/* N'afficher la pagination que si:
              1. totalPages > 1 (il y a plus d'une page)
              2. ET il y a réellement des données au-delà de la première page */}
          {totalPages > 1 && (
            (currentPage === totalPages && reviews.length > 0) || // We're on the last page and it has content
            (currentPage < totalPages && reviews.length === pageSize) // We're not on the last page and current page is full
          ) && (
            <div className={styles.userReviewsPagination}>
              <button 
                className={`${styles.paginationButton} ${styles.navButton}`}
                onClick={() => currentPage > 1 && changePage(currentPage - 1)}
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
                onClick={() => currentPage < totalPages && changePage(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserReviews;
