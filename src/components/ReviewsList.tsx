'use client';

import { useState, useEffect } from 'react';
import { FiStar, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { DocumentSnapshot } from 'firebase/firestore';
import { getReviewsByGame } from '../services/reviewService';
import { type Review } from '../schemas';
import FirebaseIndexHelper from './FirebaseIndexHelper';
import styles from '../styles/ReviewsList.module.css';

interface ReviewsListProps {
  gameId: number;
  refreshTrigger?: number; // Utilisé pour déclencher un rafraîchissement de la liste
}

const ReviewsList: React.FC<ReviewsListProps> = ({ gameId, refreshTrigger = 0 }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  const loadReviews = async (reset = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getReviewsByGame(
        gameId, 
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
      console.error('Error loading reviews:', error);
      
      // Check if it's a permissions error
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
    loadReviews(true);
    setPage(1);
  }, [gameId, refreshTrigger]);

  const handleLoadMore = () => {
    loadReviews();
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      // Since we can't easily go back in Firestore queries, we'll refetch from the beginning
      // and load the appropriate number of items
      setPage(prev => {
        const newPage = prev - 1;
        // Reset and fetch again
        setLastDoc(undefined);
        setReviews([]);
        setLoading(true);
        
        // Need to fetch all reviews up to the previous page in a real app
        // For this demo, we'll just reset to page 1
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

  return (
    <div className={styles.reviewsListContainer}>
      <h3 className={styles.reviewsListTitle}>User Reviews</h3>
      
      {error && (
        <>
          <div className={styles.reviewsListError}>
            {error}
            {error.includes('index') && (
              <p>This is a one-time setup issue. The system is creating necessary database indexes.</p>
            )}
            {error.includes('permissions') && (
              <p>This is a configuration issue. Please contact the site administrator.</p>
            )}
          </div>
          <FirebaseIndexHelper error={error} />
        </>
      )}
      
      {reviews.length === 0 ? (
        <div className={styles.noReviews}>
          {loading ? 'Loading reviews...' : 'No reviews yet. Be the first to review this game!'}
        </div>
      ) : (
        <>
          <div className={styles.reviewsList}>
            {reviews.map((review, idx) => (
              <div key={`${review.id}-${idx}`} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewUser}>
                    {review.userProfileImage ? (
                      <img 
                        src={review.userProfileImage} 
                        alt={review.username} 
                        className={styles.userAvatar} 
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {!review.userProfileImage && (
                      <div className={styles.userAvatarPlaceholder}>
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={styles.username}>{review.username}</span>
                  </div>
                  <div className={styles.reviewRating}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar
                        key={`star-${review.id}-${i}`}
                        className={i < review.rating ? styles.starFilled : styles.star}
                        fill={i < review.rating ? '#FFD700' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.reviewContent}>
                  <p className={styles.reviewComment}>{review.comment}</p>
                  <div className={styles.reviewDate}>
                    Posted on {formatDate(review.createdAt)}
                    {review.updatedAt !== review.createdAt && 
                      ` (Edited on ${formatDate(review.updatedAt)})`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.reviewsPagination}>
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

export default ReviewsList;
