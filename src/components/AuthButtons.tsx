"use client";

import React, { useState, useEffect } from 'react';
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
        if (profileResult.success) {
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
    return <UserAvatar 
      username={userProfile.username} 
      imageUrl={userProfile.profileImageUrl}
      size="small"
    />;
  }
  
  // Otherwise show login/register buttons
  return (
    <>
      <div className={styles.userMenu}>
        <button className={styles.loginBtn} onClick={openLoginModal}>
          Login
        </button>
        <button className={styles.registerBtn} onClick={openRegisterModal}>
          Register
        </button>
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
