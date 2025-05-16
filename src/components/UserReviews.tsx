'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiStar, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
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
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const router = useRouter();
  
  const pageSize = 5; // Nombre d'avis à afficher par page

  useEffect(() => {
    loadReviews(true);
  }, [userId]);

  const loadReviews = async (reset = false) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getReviewsByUser(
        userId, 
        pageSize, 
        reset ? undefined : lastDoc
      );
      
      if (result.indexRequired) {
        setError('Database index is being created. Please wait a moment and try again.');
        console.log('Please create the required index using the link in the console error message.');
        return;
      }
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (reset) {
        setReviews(result.reviews);
      } else {
        setReviews(prev => [...prev, ...result.reviews]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error: any) {
      setError(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadReviews();
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => {
        const newPage = prev - 1;
        // Reset and fetch again
        setLastDoc(undefined);
        setReviews([]);
        loadReviews(true);
        return newPage;
      });
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
    router.push(`/games/${gameId}`);
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
      
      {reviews.length === 0 ? (
        <div className={styles.noReviews}>
          {loading ? 'Loading your reviews...' : 'You haven\'t reviewed any games yet.'}
        </div>
      ) : (
        <>
          <div className={styles.userReviewsList}>
            {reviews.map((review) => (
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
            ))}
          </div>
          
          <div className={styles.userReviewsPagination}>
            <button
              className={styles.paginationButton}
              onClick={handlePrevPage}
              disabled={page === 1 || loading}
            >
              <FiChevronLeft /> Previous
            </button>
            
            <span className={styles.paginationInfo}>Page {page}</span>
            
            <button
              className={styles.paginationButton}
              onClick={handleLoadMore}
              disabled={!hasMore || loading}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </>
      )}
      
      {loading && reviews.length > 0 && (
        <div className={styles.loadingMoreReviews}>Loading more reviews...</div>
      )}
    </div>
  );
};

export default UserReviews;
