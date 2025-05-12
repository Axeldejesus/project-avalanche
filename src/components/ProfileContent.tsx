"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Profile.module.css';
import { logoutUser, auth, getUserProfile } from '../services/authenticate';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '../services/authenticate';
import DeleteAccountModal from './modals/DeleteAccountModal';
import { uploadProfileImage } from '../services/storage';
import UserAvatar from './UserAvatar';

const ProfileContent: React.FC = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user: User | null) => {
      if (user) {
        // Get user profile from Firestore
        setLoading(true);
        const profileResult = await getUserProfile(user.uid);
        if (profileResult.success) {
          setUserProfile(profileResult.data);
        }
        setLoading(false);
      } else {
        // If not logged in, redirect to home
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      router.push('/');
    } else {
      console.error('Logout error:', result.error);
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleAccountDeleted = () => {
    closeDeleteModal();
    router.push('/');
  };

  const handleImageUpload = async (file: File) => {
    setUploadError('');
    setUploadSuccess('');
    
    if (!auth?.currentUser?.uid) {
      setUploadError('User not authenticated');
      return;
    }
    
    try {
      const result = await uploadProfileImage(auth.currentUser.uid, file);
      
      if (result.success) {
        setUploadSuccess('Profile picture updated successfully');
        // Update local state with the new image URL
        setUserProfile({
          ...userProfile,
          profileImageUrl: result.imageUrl
        });
      } else {
        setUploadError(result.error || 'Failed to upload image');
      }
    } catch (error: any) {
      setUploadError(error.message || 'An unexpected error occurred');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (!userProfile) {
    return <div className={styles.notLoggedIn}>Please log in to view your profile</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.profileTitle}>Your Profile</h1>
      
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatarContainer}>
            <UserAvatar 
              username={userProfile.username} 
              imageUrl={userProfile.profileImageUrl}
              editable={true}
              onImageUpload={handleImageUpload}
              size="large"
            />
            {uploadError && <div className={styles.errorMessage}>{uploadError}</div>}
            {uploadSuccess && <div className={styles.successMessage}>{uploadSuccess}</div>}
          </div>
          <div className={styles.profileInfo}>
            <h2 className={styles.profileUsername}>{userProfile.username}</h2>
            <p className={styles.profileEmail}>{userProfile.email}</p>
            <p className={styles.profileJoinDate}>Member since: {new Date(userProfile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className={styles.profileActions}>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout
          </button>
          <button 
            className={styles.deleteAccountButton}
            onClick={openDeleteModal}
          >
            Delete Account
          </button>
        </div>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={closeDeleteModal} 
        onAccountDeleted={handleAccountDeleted} 
      />
    </div>
  );
};

export default ProfileContent;
