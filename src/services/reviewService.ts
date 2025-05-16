import { db, auth } from './authenticate';
import { collection, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, startAfter, DocumentSnapshot, setDoc, collectionGroup } from 'firebase/firestore';

export interface Review {
  id?: string;
  userId: string;
  username: string;
  userProfileImage?: string;
  gameId: number;
  gameName: string;
  gameCover: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Ajouter un nouvel avis - stocké dans une sous-collection de l'utilisateur
export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string; reviewId?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Utiliser gameId comme document ID dans la sous-collection reviews de l'utilisateur
    const reviewId = String(reviewData.gameId);
    const now = new Date().toISOString();
    
    // Chemin: review/{userId}/reviews/{gameId}
    const reviewRef = doc(db!, `review/${reviewData.userId}/reviews`, reviewId);
    
    await setDoc(reviewRef, {
      ...reviewData,
      createdAt: now,
      updatedAt: now
    });

    return { success: true, reviewId: reviewId };
  } catch (error: any) {
    console.error('Error adding review:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour un avis existant
export const updateReview = async (reviewId: string, data: { rating?: number; comment?: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Le gameId est utilisé comme reviewId
    const reviewRef = doc(db!, `review/${auth.currentUser.uid}/reviews`, reviewId);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      return { success: false, error: 'Review not found' };
    }

    await updateDoc(reviewRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating review:', error);
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

// Obtenir les avis pour un jeu spécifique
export const getReviewsByGame = async (gameId: number, pageSize: number = 10, lastDoc?: DocumentSnapshot): Promise<{ reviews: Review[]; lastDoc?: DocumentSnapshot; hasMore: boolean; error?: string; indexRequired?: boolean }> => {
  try {
    if (!db) {
      return { reviews: [], hasMore: false, error: 'Database not initialized' };
    }

    // Utiliser collectionGroup pour requêter à travers toutes les sous-collections "reviews"
    let reviewsQuery = query(
      collectionGroup(db, 'reviews'),
      where('gameId', '==', gameId),
      orderBy('createdAt', 'desc')
    );

    if (lastDoc) {
      reviewsQuery = query(reviewsQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      reviewsQuery = query(reviewsQuery, limit(pageSize));
    }

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews: Review[] = [];
    let newLastDoc: DocumentSnapshot | undefined;

    reviewsSnapshot.forEach((doc) => {
      newLastDoc = doc;
      // L'ID est maintenant le chemin complet du document
      const paths = doc.ref.path.split('/');
      const userId = paths[1]; // review/{userId}/reviews/{gameId}
      reviews.push({ 
        id: doc.id, 
        ...doc.data(),
        // Assurez-vous que userId est correctement enregistré
        userId: userId 
      } as Review);
    });

    const hasMore = reviews.length === pageSize;
    return { reviews, lastDoc: newLastDoc, hasMore };
    
  } catch (error: any) {
    console.error('Error getting reviews by game:', error);
    
    // Check if it's an index-related error
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

// Obtenir les avis d'un utilisateur
export const getReviewsByUser = async (userId: string, pageSize: number = 5, lastDoc?: DocumentSnapshot): Promise<{ reviews: Review[]; lastDoc?: DocumentSnapshot; hasMore: boolean; error?: string; indexRequired?: boolean }> => {
  try {
    if (!db) {
      return { reviews: [], hasMore: false, error: 'Database not initialized' };
    }

    // Accéder directement à la sous-collection de reviews de l'utilisateur
    let reviewsQuery = query(
      collection(db, `review/${userId}/reviews`),
      orderBy('createdAt', 'desc')
    );

    if (lastDoc) {
      reviewsQuery = query(reviewsQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      reviewsQuery = query(reviewsQuery, limit(pageSize));
    }

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews: Review[] = [];
    let newLastDoc: DocumentSnapshot | undefined;

    reviewsSnapshot.forEach((doc) => {
      newLastDoc = doc;
      reviews.push({ 
        id: doc.id, 
        ...doc.data(),
        userId: userId // Assurez-vous que le userId est correct
      } as Review);
    });

    const hasMore = reviews.length === pageSize;
    return { reviews, lastDoc: newLastDoc, hasMore };
    
  } catch (error: any) {
    console.error('Error getting reviews by user:', error);
    
    // Check if it's an index-related error
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

// Vérifier si l'utilisateur a déjà évalué ce jeu
export const getUserGameReview = async (userId: string, gameId: number): Promise<Review | null> => {
  try {
    if (!db) {
      return null;
    }

    // Accès direct au document: review/{userId}/reviews/{gameId}
    const reviewRef = doc(db, `review/${userId}/reviews`, String(gameId));
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      return null;
    }

    return { 
      id: reviewDoc.id, 
      ...reviewDoc.data(),
      userId: userId // S'assurer que userId est correct
    } as Review;
    
  } catch (error: any) {
    console.error('Error checking if user reviewed game:', error);
    return null;
  }
};
