import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { updateUserProfile } from "./authenticate";

// Check if we're running on the client (browser) or server
const isClient = typeof window !== 'undefined';

// Initialize Firebase Storage
let storage: FirebaseStorage | undefined;

if (isClient) {
  try {
    storage = getStorage();
    console.log('Firebase Storage initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Storage:', error);
  }
}

/**
 * Uploads a profile image for a user and updates their profile
 * @param userId The ID of the user
 * @param file The image file to upload
 * @returns Object with success status and either the download URL or error
 */
export const uploadProfileImage = async (userId: string, file: File) => {
  if (!isClient || !storage) {
    console.error('Firebase storage is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Le fichier doit être une image' };
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'L\'image ne doit pas dépasser 2MB' };
    }

    // Create a storage reference
    const storageRef = ref(storage, `profile-images/${userId}/${Date.now()}_${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('File uploaded successfully:', snapshot.metadata.name);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update the user profile with the image URL
    const updateResult = await updateUserProfile(userId, { 
      profileImageUrl: downloadURL 
    });
    
    if (!updateResult.success) {
      return { 
        success: false, 
        error: 'Image uploaded but failed to update profile',
        imageUrl: downloadURL
      };
    }
    
    return { 
      success: true, 
      imageUrl: downloadURL 
    };
  } catch (error: any) {
    console.error("Error uploading profile image:", error);
    return {
      success: false,
      error: error.message || 'Error uploading image'
    };
  }
};
