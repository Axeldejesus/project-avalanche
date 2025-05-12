import { db, auth, ensureFirestore } from './authenticate';
import { doc, updateDoc } from 'firebase/firestore';
import { getUserProfile } from './authenticate';

/**
 * Uploads a profile image for the specified user
 * @param userId User ID
 * @param file Image file to upload
 * @returns Result object with success status and image URL
 */
export async function uploadProfileImage(userId: string, file: File): Promise<{ 
  success: boolean; 
  imageUrl?: string; 
  error?: string 
}> {
  try {
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'Image size must be less than 2MB' };
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // Generate a unique filename using the userId and timestamp
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const filename = `${userId}-${timestamp}.${fileExtension}`;
    const filePath = `/images/profile-pictures/${filename}`;
    
    // Create a FormData object to send the file to the server
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);
    formData.append('path', filePath);

    // Send the image to our API endpoint
    const response = await fetch('/api/upload-profile-image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to upload image' };
    }

    const data = await response.json();
    
    try {
      // Update user profile in Firestore
      // Changed from 'users' to 'utilisateur' to match your collection name
      const firestore = ensureFirestore();
      const userRef = doc(firestore, 'utilisateur', userId);
      await updateDoc(userRef, {
        profilePicture: true,
        profileImageUrl: filePath
      });
      
      // Add this line to notify other components of the profile update
      localStorage.setItem('profileImageUpdated', Date.now().toString());
    } catch (firestoreError: any) {
      console.error('Firestore update error:', firestoreError);
      // Still return success if the image upload worked, even if the profile update failed
      return { 
        success: true, 
        imageUrl: filePath, 
        error: 'Image uploaded but profile not updated: ' + firestoreError.message 
      };
    }

    // Return success with the image URL
    return { success: true, imageUrl: filePath };
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Gets the profile image URL for a user
 * @param imageUrl Relative path to the image or full URL
 * @returns Absolute URL to the profile image
 */
export function getProfileImageUrl(imageUrl?: string): string {
  if (!imageUrl) {
    return '/placeholder-avatar.png';
  }
  
  // If it's already an absolute URL, return it as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Otherwise, make it a full path based on our public folder
  return imageUrl;
}
