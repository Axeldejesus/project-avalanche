import { db, auth, ensureFirestore } from './authenticate';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Récupère le profil utilisateur depuis Firestore
 * @param userId ID de l'utilisateur
 * @returns Profil utilisateur
 */
export const getUserProfile = async (userId: string) => {
  try {
    if (!db) {
      return { success: false, error: 'Database not initialized' };
    }

    const userRef = doc(db, "utilisateur", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { 
        success: false, 
        error: 'User profile not found' 
      };
    }
    
    return {
      success: true,
      data: userSnap.data()
    };
  } catch (error: any) {
    console.error("Error getting user profile:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
