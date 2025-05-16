"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';
import UserAvatar from './UserAvatar';
import { onAuthStateChange, auth, getUserProfile } from '../services/authenticate';
import { User } from 'firebase/auth';

const AuthButtons: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileUpdateTimestamp, setProfileUpdateTimestamp] = useState<string | null>(
    localStorage.getItem('profileImageUpdated')
  );
  const [usernameUpdateTimestamp, setUsernameUpdateTimestamp] = useState<string | null>(
    localStorage.getItem('profileUsernameUpdated')
  );

  // Add pathname to detect current route
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile' || pathname.startsWith('/profile/');

  // Initialize state from localStorage if available (to prevent flash)
  useEffect(() => {
    // Check localStorage for cached auth state
    const cachedAuthState = localStorage.getItem('userIsAuthenticated');
    
    // Set initial loading state based on cached data
    if (cachedAuthState === 'true') {
      // Don't show login buttons if we think user is authenticated
      setIsLoading(true);
    } else if (cachedAuthState === 'false') {
      // Safe to show login buttons if we know user isn't authenticated
      setIsLoading(false);
    }
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Store in localStorage that user is authenticated
        localStorage.setItem('userIsAuthenticated', 'true');
        
        // Get the user's profile from Firestore
        const profileResult = await getUserProfile(user.uid);
        if (profileResult.success && profileResult.data) {  // Added check for data
          setUserProfile(profileResult.data);
        }
      } else {
        // Clear authentication flag in localStorage
        localStorage.setItem('userIsAuthenticated', 'false');
        setUserProfile(null);
      }
      
      // Either way, we now know the auth state, so we're not loading anymore
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Add enhanced effect to check for profile updates (both image and username)
  useEffect(() => {
    // Function to check if profile was updated
    const checkProfileUpdates = () => {
      const newImageTimestamp = localStorage.getItem('profileImageUpdated');
      const newUsernameTimestamp = localStorage.getItem('profileUsernameUpdated');
      
      // Check if either image or username was updated
      if (newImageTimestamp !== profileUpdateTimestamp || 
          newUsernameTimestamp !== usernameUpdateTimestamp) {
        
        setProfileUpdateTimestamp(newImageTimestamp);
        setUsernameUpdateTimestamp(newUsernameTimestamp);
        
        // If user is logged in, refresh their profile
        if (currentUser) {
          getUserProfile(currentUser.uid).then(profileResult => {
            if (profileResult.success && profileResult.data) {  // Added check for data
              setUserProfile(profileResult.data);
            }
          });
        }
      }
    };
    
    // Check immediately (for when returning to the page)
    checkProfileUpdates();
    
    // Also set up an interval to periodically check
    const intervalId = setInterval(checkProfileUpdates, 5000);
    
    // Set up event listener for visibility changes
    document.addEventListener('visibilitychange', checkProfileUpdates);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', checkProfileUpdates);
    };
  }, [currentUser, profileUpdateTimestamp, usernameUpdateTimestamp]);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
  };
  
  const openRegisterModal = () => {
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
  };
  
  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };
  
  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };
  
  // Show nothing during initial loading
  if (isLoading) {
    return <div className={styles.authLoading}></div>; // Empty div with minimal width to prevent layout shift
  }
  
  // If user is logged in, show avatar
  if (currentUser && userProfile) {
    return (
      <div className={`${styles.userMenu} ${styles.userMenuLoggedIn}`}>
        <Link href="/profile">
          <div className={`${styles.userButton} ${isProfilePage ? styles.userButtonActive : ''}`}>
            {userProfile.profileImageUrl ? (
              <div 
                className={styles.userAvatar}
                style={{ 
                  backgroundImage: `url(${userProfile.profileImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%'
                }}
              />
            ) : (
              userProfile.username?.[0]?.toUpperCase() || 'A'
            )}
          </div>
        </Link>
        <div className={styles.usernameDisplay}>
          {userProfile.username || 'User'}
        </div>
      </div>
    );
  }
  
  // Otherwise show login/register buttons
  return (
    <>
      <div className={styles.userMenu}>
        <div className={styles.authButtonsContainer}>
          <button className={styles.loginBtn} onClick={openLoginModal}>
            Login
          </button>
          <button className={styles.registerBtn} onClick={openRegisterModal}>
            Register
          </button>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal} 
        onSwitchToRegister={openRegisterModal} 
      />
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={closeRegisterModal} 
        onSwitchToLogin={openLoginModal} 
      />
    </>
  );
};

export default AuthButtons;
