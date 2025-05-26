import { db} from './authenticate';
import { doc, getDoc} from 'firebase/firestore';
import { UserProfileSchema } from '../schemas';

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

    // Validate userId
    const validatedUserId = UserProfileSchema.shape.userId ? 
      UserProfileSchema.shape.userId.parse(userId) : 
      userId; // Fallback if userId is not in schema

    const userRef = doc(db, "utilisateur", validatedUserId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { 
        success: false, 
        error: 'User profile not found' 
      };
    }
    
    try {
      // Validate user profile data from Firestore
      const profileData = UserProfileSchema.parse(userSnap.data());
      
      return {
        success: true,
        data: profileData
      };
    } catch (validationError: any) {
      console.error('Invalid user profile data in Firestore:', validationError);
      
      // Return raw data with warning if validation fails
      return {
        success: true,
        data: userSnap.data(),
        warning: 'Profile data validation failed but returning raw data'
      };
    }
  } catch (error: any) {
    console.error("Error getting user profile:", error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};
