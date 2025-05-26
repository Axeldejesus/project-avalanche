import { ensureFirestore } from './authenticate';
import { doc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

// Input validation schemas
const UploadImageInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  file: z.instanceof(File).refine(
    (file) => file.size <= 2 * 1024 * 1024,
    "Image size must be less than 2MB"
  ).refine(
    (file) => file.type.startsWith('image/'),
    "File must be an image"
  )
});

const ImageUrlSchema = z.string().optional().nullable();

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
    // Validate input with Zod
    const validatedInput = UploadImageInputSchema.parse({ userId, file });

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
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        success: false, 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Gets the profile image URL for a user
 * @param imageUrl Relative path to the image or full URL
 * @returns Absolute URL to the profile image
 */
export function getProfileImageUrl(imageUrl?: string | null): string {
  try {
    // Validate input
    const validatedImageUrl = ImageUrlSchema.parse(imageUrl);
    
    if (!validatedImageUrl) {
      return '/placeholder-avatar.png';
    }
    
    // If it's already an absolute URL, return it as is
    if (validatedImageUrl.startsWith('http')) {
      return validatedImageUrl;
    }
    
    // Otherwise, make it a full path based on our public folder
    return validatedImageUrl;
  } catch (error) {
    console.error('Error validating image URL:', error);
    return '/placeholder-avatar.png';
  }
}
