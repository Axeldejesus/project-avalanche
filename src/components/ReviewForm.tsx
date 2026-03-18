'use client';

import { useEffect, useState } from 'react';
import { Check, MessageSquareText, PencilLine, Star, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { addReview, deleteReview, getUserGameReview, updateReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { Review } from '../schemas/index';

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
          setComment(review.comment || ''); // Handle undefined comment
        }
      }
    };

    checkExistingReview();
  }, [user, gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (rating === 0 && comment.trim() === '') {
      setError('Please provide either a rating or a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let result;

      if (existingReview) {
        const updateData: any = {};
        if (rating > 0) updateData.rating = rating;
        if (comment.trim() !== '') updateData.comment = comment;
        
        result = await updateReview(String(gameId), updateData);

        if (result.success) {
          setExistingReview({
            ...existingReview,
            rating,
            comment: comment || undefined, // Handle empty comment
            updatedAt: new Date().toISOString()
          });
          setSuccess('Your review has been updated!');
          setIsEditing(false);
          onReviewSubmitted();
        } else {
          setError(result.error || 'Failed to update review. Please try again.');
        }
      } else {
        const existingUserReview = await getUserGameReview(user.uid, gameId);

        if (existingUserReview) {
          setExistingReview(existingUserReview);
          setRating(existingUserReview.rating);
          setComment(existingUserReview.comment || ''); // Handle undefined comment
          setIsEditing(true);
          setError('You already reviewed this game. You can edit your existing review.');
          setIsSubmitting(false);
          return;
        }

        const reviewData: any = {
          userId: user.uid,
          username: userProfile.username || user.email!.split('@')[0],
          gameId,
          gameName,
          gameCover,
          rating,
        };
        
        // Only include userProfileImage if it exists and is not empty
        if (userProfile.profileImageUrl && userProfile.profileImageUrl.trim() !== '') {
          reviewData.userProfileImage = userProfile.profileImageUrl;
        }
        
        if (comment.trim() !== '') {
          reviewData.comment = comment;
        }

        result = await addReview(reviewData);

        if (result.success && result.reviewId) {
          const newReview: Review = {
            id: result.reviewId,
            userId: user.uid,
            username: userProfile.username || user.email!.split('@')[0],
            gameId,
            gameName,
            gameCover,
            rating,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Only include optional fields if they exist
          if (userProfile.profileImageUrl && userProfile.profileImageUrl.trim() !== '') {
            newReview.userProfileImage = userProfile.profileImageUrl;
          }
          
          if (comment.trim() !== '') {
            newReview.comment = comment;
          }

          setExistingReview(newReview);
          setSuccess('Your review has been submitted!');
          onReviewSubmitted();
        } else {
          setError(result.error || 'Failed to submit review');
        }
      }
    } catch (error: any) {
      console.error('Error in review submission:', error);
      setError(error.message || 'An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;

    if (!confirm('Are you sure you want to delete your review?')) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteReview(String(gameId));

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
      setComment(existingReview.comment || ''); // Handle undefined comment
    } else {
      setRating(0);
      setComment('');
    }
    setIsEditing(false);
    setSuccess(null);
  };

  if (!user) {
    return (
      <div className="rounded-[28px] border border-white/8 bg-white/4 px-5 py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/8 bg-black/20 text-muted-foreground">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">Connecte-toi pour publier un avis</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ton rating et ton commentaire seront rattaches a ton profil et visibles dans la fiche du jeu.
        </p>
      </div>
    );
  }

  const isReadOnly = Boolean(existingReview && !isEditing);
  const title = existingReview ? (isEditing ? 'Modifier ton avis' : 'Ton avis') : 'Publier un avis';
  const subtitle = existingReview
    ? isEditing
      ? 'Affinez la note ou le commentaire sans perdre votre historique.'
      : 'Ton retour est deja en ligne. Tu peux le retoucher ou le retirer.'
    : 'Ajoute une note rapide ou un commentaire plus detaille pour enrichir la fiche.';

  return (
    <div className="surface-panel rounded-[28px] p-5 md:p-6">
      <div className="flex flex-col gap-2 border-b border-white/8 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Review</p>
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
        <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {error ? (
        <div className="mt-4 rounded-[20px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-[20px] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ta note</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating}/5` : 'Aucune note pour le moment'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isActive = hoveredRating ? starValue <= hoveredRating : starValue <= rating;

                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => !isSubmitting && !isReadOnly && setRating(starValue)}
                    onMouseEnter={() => !isSubmitting && !isReadOnly && setHoveredRating(starValue)}
                    onMouseLeave={() => !isSubmitting && !isReadOnly && setHoveredRating(0)}
                    disabled={isReadOnly || isSubmitting}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                      isActive
                        ? 'border-amber-400/30 bg-amber-400/12 text-amber-300'
                        : 'border-white/8 bg-black/20 text-muted-foreground',
                      !isReadOnly && 'hover:border-white/12 hover:bg-white/8 hover:text-foreground'
                    )}
                    aria-label={`Donner ${starValue} etoile${starValue > 1 ? 's' : ''}`}
                  >
                    <Star className="h-5 w-5" fill={isActive ? 'currentColor' : 'none'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="review-comment" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Commentaire
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={isSubmitting || isReadOnly}
            placeholder="Ce que tu retiens du jeu, ce qui marche, ce qui casse le rythme, ce qui merite d'etre signale."
            rows={6}
            className={cn(
              'min-h-[150px] w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70',
              isReadOnly ? 'cursor-default opacity-80' : 'focus:border-primary/40 focus:bg-black/25'
            )}
          />
        </div>

        {existingReview && !isEditing ? (
          <div className="flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:justify-between">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Publie le {new Date(existingReview.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-white/10 bg-white/5"
                disabled={isSubmitting}
                onClick={() => {
                  setIsEditing(true);
                  setSuccess('Mode edition active.');
                }}
              >
                <PencilLine className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
                disabled={isSubmitting}
                onClick={handleDeleteReview}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Une note ou un commentaire suffit pour enregistrer ton avis.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-white/10 bg-white/5"
                  onClick={(event) => {
                    event.preventDefault();
                    handleCancel();
                  }}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
              ) : null}
              <Button type="submit" className="gap-2" disabled={isSubmitting}>
                {isSubmitting ? <span>Envoi...</span> : <><Check className="h-4 w-4" />{existingReview ? 'Mettre a jour' : 'Publier'}</>}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ReviewForm;
