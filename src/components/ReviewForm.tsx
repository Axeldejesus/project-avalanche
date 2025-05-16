'use client';

import { useState, useEffect } from 'react';
import { FiStar, FiEdit, FiTrash2 } from 'react-icons/fi';
import { addReview, updateReview, deleteReview, getUserGameReview, Review } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/ReviewForm.module.css';

interface ReviewFormProps {
  gameId: number;
  gameName: string;
  gameCover: string;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ gameId, gameName, gameCover, onReviewSubmitted }) => {
  const { user, userProfile } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    const checkExistingReview = async () => {
      if (user && user.uid) {
        const review = await getUserGameReview(user.uid, gameId);
        if (review) {
          setExistingReview(review);
          setRating(review.rating);
          setComment(review.comment);
        }
      }
    };

    checkExistingReview();
  }, [user, gameId]);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleRatingHover = (hoveredRating: number) => {
    setHoveredRating(hoveredRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim() === '') {
      setError('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (existingReview && !isEditing) {
        setIsEditing(true);
        setIsSubmitting(false);
        return;
      }

      let result;
      
      if (existingReview && isEditing) {
        // Update existing review
        result = await updateReview(existingReview.id!, {
          rating,
          comment
        });
        
        if (result.success) {
          setExistingReview({
            ...existingReview,
            rating,
            comment,
            updatedAt: new Date().toISOString()
          });
          setSuccess('Your review has been updated!');
          setIsEditing(false);
        }
      } else {
        // Add new review
        result = await addReview({
          userId: user.uid,
          username: userProfile.username || user.email!.split('@')[0],
          userProfileImage: userProfile.profileImageUrl,
          gameId,
          gameName,
          gameCover,
          rating,
          comment
        });
        
        if (result.success && result.reviewId) {
          setExistingReview({
            id: result.reviewId,
            userId: user.uid,
            username: userProfile.username || user.email!.split('@')[0],
            userProfileImage: userProfile.profileImageUrl,
            gameId,
            gameName,
            gameCover,
            rating,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setSuccess('Your review has been submitted!');
        }
      }

      if (!result.success) {
        setError(result.error || 'Failed to submit review');
      } else {
        onReviewSubmitted();
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview || !existingReview.id) return;
    
    if (!confirm('Are you sure you want to delete your review?')) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteReview(existingReview.id);
      
      if (result.success) {
        setExistingReview(null);
        setRating(0);
        setComment('');
        setSuccess('Your review has been deleted');
        onReviewSubmitted();
      } else {
        setError(result.error || 'Failed to delete review');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while deleting your review');
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className={styles.reviewFormLoginPrompt}>
        <p>Please log in to leave a review</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewFormContainer}>
      <h3 className={styles.reviewFormTitle}>
        {existingReview && !isEditing ? 'Your Review' : (existingReview ? 'Edit Your Review' : 'Write a Review')}
      </h3>
      
      {error && <div className={styles.reviewFormError}>{error}</div>}
      {success && <div className={styles.reviewFormSuccess}>{success}</div>}
      
      <form onSubmit={handleSubmit} className={styles.reviewForm}>
        <div className={styles.ratingContainer}>
          <label>Rating:</label>
          <div className={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className={styles.starWrapper}
                onClick={() => !isSubmitting && (isEditing || !existingReview) && handleRatingClick(star)}
                onMouseEnter={() => !isSubmitting && (isEditing || !existingReview) && handleRatingHover(star)}
                onMouseLeave={() => !isSubmitting && (isEditing || !existingReview) && handleRatingHover(0)}
              >
                <FiStar
                  className={`${styles.star} ${
                    (hoveredRating ? star <= hoveredRating : star <= rating)
                      ? styles.starActive
                      : ''
                  } ${!(isEditing || !existingReview) ? styles.starDisabled : ''}`}
                  fill={
                    (hoveredRating ? star <= hoveredRating : star <= rating)
                      ? '#FFD700'
                      : 'none'
                  }
                />
              </div>
            ))}
            <span className={styles.ratingText}>
              {rating > 0 ? `${rating} Star${rating !== 1 ? 's' : ''}` : 'Select Rating'}
            </span>
          </div>
        </div>
        
        <div className={styles.commentContainer}>
          <label htmlFor="review-comment">Comment:</label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting || (!isEditing && existingReview !== null)}
            placeholder="Share your thoughts about this game..."
            className={styles.commentTextarea}
            rows={4}
          />
        </div>
        
        <div className={styles.reviewFormActions}>
          {existingReview && !isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
                disabled={isSubmitting}
              >
                <FiEdit /> Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                className={styles.deleteButton}
                disabled={isSubmitting}
              >
                <FiTrash2 /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : (existingReview ? 'Update' : 'Submit')}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
