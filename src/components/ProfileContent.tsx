"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Profile.module.css';
import { logoutUser, auth, getUserProfile, updateUserProfile } from '../services/authenticate';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '../services/authenticate';
import DeleteAccountModal from './modals/DeleteAccountModal';
import UserAvatar from './UserAvatar';
import { uploadProfileImage } from '../services/imageService';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import UserReviews from './UserReviews'; // Import du nouveau composant

const ProfileContent: React.FC = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user: User | null) => {
      if (user) {
        // Get user profile from Firestore
        setLoading(true);
        const profileResult = await getUserProfile(user.uid);
        if (profileResult.success && profileResult.data) {  // Added check for data
          setUserProfile(profileResult.data);
          setNewUsername(profileResult.data.username || '');
        }
        setLoading(false);
      } else {
        // If not logged in, redirect to home
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = () => {
    // Créer un écran de chargement
    const loadingScreen = document.createElement('div');
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = '#121212';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.zIndex = '9999';
    loadingScreen.style.color = 'white';
    loadingScreen.style.fontSize = '20px';
    loadingScreen.style.fontFamily = 'var(--font-space-grotesk), sans-serif';
    
    // Ajouter un spinner (cercle de chargement)
    const spinner = document.createElement('div');
    spinner.style.border = '5px solid rgba(255, 255, 255, 0.1)';
    spinner.style.borderTop = '5px solid #7c3aed';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.animation = 'spin 1s linear infinite';
    spinner.style.marginBottom = '20px';
    
    // Ajouter une règle d'animation pour le spinner
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    // Ajouter le message
    const message = document.createElement('p');
    message.textContent = 'Logging out, please wait...';
    
    // Assembler et ajouter à la page
    loadingScreen.appendChild(spinner);
    loadingScreen.appendChild(message);
    document.body.appendChild(loadingScreen);
    
    // Lancer la déconnexion en arrière-plan
    logoutUser().catch(error => {
      console.error('Logout error:', error);
    });
    
    // Rediriger après un court délai pour s'assurer que l'écran de chargement s'affiche
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
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
          profileImageUrl: result.imageUrl,
          profilePicture: true
        });
      } else {
        setUploadError(result.error || 'Failed to upload image');
      }
    } catch (error: any) {
      setUploadError(error.message || 'An unexpected error occurred');
    }
  };

  const startEditingUsername = () => {
    setNewUsername(userProfile.username || '');
    setUsernameError('');
    setUsernameSuccess('');
    setIsEditingUsername(true);
  };

  const cancelEditingUsername = () => {
    setIsEditingUsername(false);
    setUsernameError('');
  };

  const saveUsername = async () => {
    setUsernameError('');
    setUsernameSuccess('');
    
    // Validate username
    if (!newUsername || newUsername.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    
    if (!auth?.currentUser?.uid) {
      setUsernameError('User not authenticated');
      return;
    }
    
    try {
      const result = await updateUserProfile(auth.currentUser.uid, {
        username: newUsername.trim()
      });
      
      if (result.success) {
        // Update local state
        setUserProfile({
          ...userProfile,
          username: newUsername.trim()
        });
        setUsernameSuccess('Username updated successfully');
        setIsEditingUsername(false);
        
        // Update localStorage to notify other components
        localStorage.setItem('profileUsernameUpdated', Date.now().toString());
      } else {
        setUsernameError(result.error || 'Failed to update username');
      }
    } catch (error: any) {
      setUsernameError(error.message || 'An unexpected error occurred');
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
            {isEditingUsername ? (
              <div className={styles.usernameEditContainer}>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className={styles.usernameInput}
                  placeholder="Enter new username"
                  autoFocus
                />
                <div className={styles.usernameEditButtons}>
                  <button onClick={saveUsername} className={styles.usernameEditButton}>
                    <FiCheck />
                  </button>
                  <button onClick={cancelEditingUsername} className={styles.usernameEditButton}>
                    <FiX />
                  </button>
                </div>
                {usernameError && <div className={styles.usernameErrorMessage}>{usernameError}</div>}
              </div>
            ) : (
              <div className={styles.usernameContainer}>
                <h2 className={styles.profileUsername}>{userProfile.username}</h2>
                <button onClick={startEditingUsername} className={styles.editButton} aria-label="Edit username">
                  <FiEdit2 />
                </button>
                {usernameSuccess && <div className={styles.usernameSuccessMessage}>{usernameSuccess}</div>}
              </div>
            )}
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

      {/* Ajouter la section des avis de l'utilisateur */}
      {userProfile && (
        <UserReviews userId={auth?.currentUser?.uid || ''} />
      )}

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={closeDeleteModal} 
        onAccountDeleted={handleAccountDeleted} 
      />
    </div>
  );
};

export default ProfileContent;
