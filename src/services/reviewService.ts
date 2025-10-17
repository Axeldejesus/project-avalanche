import { db, auth } from './authenticate';
import { collection, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, startAfter, DocumentSnapshot, setDoc, collectionGroup } from 'firebase/firestore';
import { 
  ReviewSchema, 
  ReviewInputSchema, 
  UpdateReviewInputSchema,
  type Review,
  type ReviewInput,
  type UpdateReviewInput
} from '../schemas';

// ⚠️ SÉCURITÉ: Sanitization des inputs
const sanitizeText = (text: string | undefined): string | undefined => {
  if (!text) return undefined;
  // Supprimer les scripts et balises HTML potentiellement dangereuses
  return text.replace(/<script[^>]*>.*?<\/script>/gi, '')
             .replace(/<[^>]*>/g, '')
             .trim();
};

// Ajouter un nouvel avis - stocké dans une sous-collection de l'utilisateur
export const addReview = async (reviewData: ReviewInput & { userId: string; username: string; userProfileImage?: string }): Promise<{ success: boolean; error?: string; reviewId?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // ⚠️ SÉCURITÉ: Vérifier que l'userId correspond à l'utilisateur connecté
    if (reviewData.userId !== auth.currentUser.uid) {
      return { success: false, error: 'Unauthorized: User ID mismatch' };
    }

    // ⚠️ SÉCURITÉ: Sanitization des données
    const sanitizedData = {
      ...reviewData,
      username: sanitizeText(reviewData.username) || 'Anonymous',
      comment: sanitizeText(reviewData.comment)
    };

    // Validate input with Zod
    const validatedData = ReviewInputSchema.extend({
      userId: ReviewSchema.shape.userId,
      username: ReviewSchema.shape.username,
      userProfileImage: ReviewSchema.shape.userProfileImage
    }).parse(sanitizedData);

    // Utiliser gameId comme document ID dans la sous-collection reviews de l'utilisateur
    const reviewId = String(validatedData.gameId);
    const now = new Date().toISOString();
    
    // Chemin: review/{userId}/reviews/{gameId}
    const reviewRef = doc(db!, `review/${validatedData.userId}/reviews`, reviewId);
    
    // Create review document, excluding undefined fields
    const reviewDocument: any = {
      userId: validatedData.userId,
      username: validatedData.username,
      gameId: validatedData.gameId,
      gameName: sanitizeText(validatedData.gameName) || 'Unknown Game',
      gameCover: validatedData.gameCover,
      rating: validatedData.rating,
      createdAt: now,
      updatedAt: now
    };

    // Only include userProfileImage if it's defined and not empty
    if (validatedData.userProfileImage && validatedData.userProfileImage.trim() !== '') {
      reviewDocument.userProfileImage = validatedData.userProfileImage;
    }

    // Only include comment if it's defined and not empty
    if (validatedData.comment && validatedData.comment.trim() !== '') {
      reviewDocument.comment = validatedData.comment;
    }

    await setDoc(reviewRef, reviewDocument);

    return { success: true, reviewId: reviewId };
  } catch (error: any) {
    console.error('Error adding review:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        success: false, 
        error: 'Invalid data: ' + error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    // ⚠️ SÉCURITÉ: Ne pas exposer les détails de l'erreur
    return { success: false, error: 'An error occurred while adding the review' };
  }
};

// Mettre à jour un avis existant
export const updateReview = async (reviewId: string, data: UpdateReviewInput): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate input with Zod
    const validatedData = UpdateReviewInputSchema.parse(data);

    // Le gameId est utilisé comme reviewId
    const reviewRef = doc(db!, `review/${auth.currentUser.uid}/reviews`, reviewId);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      return { success: false, error: 'Review not found' };
    }

    await updateDoc(reviewRef, {
      ...validatedData,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating review:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        success: false, 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Supprimer un avis
export const deleteReview = async (reviewId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const reviewRef = doc(db!, `review/${auth.currentUser.uid}/reviews`, reviewId);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      return { success: false, error: 'Review not found' };
    }

    await deleteDoc(reviewRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les avis d'un utilisateur - OPTIMISÉ
export const getReviewsByUser = async (userId: string, pageSize: number = 5, lastDoc?: DocumentSnapshot): Promise<{ reviews: Review[]; lastDoc?: DocumentSnapshot; hasMore: boolean; error?: string; indexRequired?: boolean }> => {
  try {
    if (!db) {
      return { reviews: [], hasMore: false, error: 'Database not initialized' };
    }

    // Accéder directement à la sous-collection de reviews de l'utilisateur
    let reviewsQuery = query(
      collection(db, `review/${userId}/reviews`),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // +1 pour savoir s'il y a plus de pages
    );

    if (lastDoc) {
      reviewsQuery = query(reviewsQuery, startAfter(lastDoc));
    }

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews: Review[] = [];
    let newLastDoc: DocumentSnapshot | undefined;
    const hasMore = reviewsSnapshot.docs.length > pageSize;

    // Ne prendre que pageSize éléments
    const docsToProcess = reviewsSnapshot.docs.slice(0, pageSize);
    
    docsToProcess.forEach((doc) => {
      newLastDoc = doc;
      reviews.push({ 
        id: doc.id, 
        ...doc.data(),
        userId: userId
      } as Review);
    });

    return { reviews, lastDoc: newLastDoc, hasMore };
    
  } catch (error: any) {
    console.error('Error getting reviews by user:', error);
    
    if (error.message && error.message.includes('index')) {
      return { 
        reviews: [], 
        hasMore: false, 
        error: 'This query requires an index. Please follow the link in the console to create it.', 
        indexRequired: true 
      };
    }
    
    return { reviews: [], hasMore: false, error: error.message };
  }
};

// Obtenir les avis pour un jeu spécifique - OPTIMISÉ
export const getReviewsByGame = async (gameId: number, pageSize: number = 10, lastDoc?: DocumentSnapshot): Promise<{ reviews: Review[]; lastDoc?: DocumentSnapshot; hasMore: boolean; error?: string; indexRequired?: boolean }> => {
  try {
    if (!db) {
      return { reviews: [], hasMore: false, error: 'Database not initialized' };
    }

    const validatedGameId = ReviewSchema.shape.gameId.parse(gameId);

    let reviewsQuery = query(
      collectionGroup(db, 'reviews'),
      where('gameId', '==', validatedGameId),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // +1 pour savoir s'il y a plus de pages
    );

    if (lastDoc) {
      reviewsQuery = query(reviewsQuery, startAfter(lastDoc));
    }

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews: Review[] = [];
    let newLastDoc: DocumentSnapshot | undefined;
    const hasMore = reviewsSnapshot.docs.length > pageSize;

    const docsToProcess = reviewsSnapshot.docs.slice(0, pageSize);

    docsToProcess.forEach((doc) => {
      newLastDoc = doc;
      const paths = doc.ref.path.split('/');
      const userId = paths[1];
      
      try {
        const rawData = doc.data();
        const safeReviewData = {
          id: doc.id, 
          userId: userId,
          username: rawData?.username || '',
          userProfileImage: rawData?.userProfileImage,
          gameId: rawData?.gameId || 0,
          gameName: rawData?.gameName || '',
          gameCover: rawData?.gameCover || '',
          rating: rawData?.rating || 1,
          comment: rawData?.comment,
          createdAt: rawData?.createdAt || new Date().toISOString(),
          updatedAt: rawData?.updatedAt || new Date().toISOString()
        };
        
        const reviewData = ReviewSchema.parse(safeReviewData);
        reviews.push(reviewData);
      } catch (validationError) {
        console.error('Invalid review data in Firestore:', validationError);
      }
    });

    return { reviews, lastDoc: newLastDoc, hasMore };
    
  } catch (error: any) {
    console.error('Error getting reviews by game:', error);
    
    if (error.name === 'ZodError') {
      return { 
        reviews: [], 
        hasMore: false, 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { reviews: [], hasMore: false, error: error.message };
  }
};

// Vérifier si l'utilisateur a déjà évalué ce jeu
export const getUserGameReview = async (userId: string, gameId: number): Promise<Review | null> => {
  try {
    if (!db) {
      return null;
    }

    // Validate inputs
    const validatedGameId = ReviewSchema.shape.gameId.parse(gameId);
    const validatedUserId = ReviewSchema.shape.userId.parse(userId);

    // Accès direct au document: review/{userId}/reviews/{gameId}
    const reviewRef = doc(db, `review/${validatedUserId}/reviews`, String(validatedGameId));
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      return null;
    }

    try {
      const reviewData = reviewDoc.data();
      
      // Create a safe review object with fallback values
      const safeReviewData = {
        id: reviewDoc.id,
        userId: validatedUserId,
        username: reviewData?.username || '',
        userProfileImage: reviewData?.userProfileImage,
        gameId: validatedGameId,
        gameName: reviewData?.gameName || '',
        gameCover: reviewData?.gameCover || '',
        rating: reviewData?.rating || 1,
        comment: reviewData?.comment,
        createdAt: reviewData?.createdAt || new Date().toISOString(),
        updatedAt: reviewData?.updatedAt || new Date().toISOString()
      };

      // Validate the complete review object
      return ReviewSchema.parse(safeReviewData);
    } catch (validationError) {
      console.error('Review validation error:', validationError);
      return null;
    }
    
  } catch (error: any) {
    console.error('Error checking if user reviewed game:', error);
    return null;
  }
};

// Export the Review type for convenience
export type { Review, ReviewInput, UpdateReviewInput };
