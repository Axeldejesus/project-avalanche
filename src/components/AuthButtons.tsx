"use client";

import React, { useState, useEffect } from 'react';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { onAuthStateChange, getUserProfile } from '../services/authenticate';
import { User } from 'firebase/auth';
import { LogIn, UserPlus } from 'lucide-react';

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

  useEffect(() => {
    const cachedAuthState = localStorage.getItem('userIsAuthenticated');
    if (cachedAuthState !== 'true') setIsLoading(false);

    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        localStorage.setItem('userIsAuthenticated', 'true');
        const profileResult = await getUserProfile(user.uid);
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
        }
      } else {
        localStorage.setItem('userIsAuthenticated', 'false');
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Écoute les mises à jour de profil via localStorage
  useEffect(() => {
    const checkProfileUpdates = () => {
      const newImageTimestamp = localStorage.getItem('profileImageUpdated');
      const newUsernameTimestamp = localStorage.getItem('profileUsernameUpdated');

      if (
        newImageTimestamp !== profileUpdateTimestamp ||
        newUsernameTimestamp !== usernameUpdateTimestamp
      ) {
        setProfileUpdateTimestamp(newImageTimestamp);
        setUsernameUpdateTimestamp(newUsernameTimestamp);

        if (currentUser) {
          getUserProfile(currentUser.uid).then((profileResult) => {
            if (profileResult.success && profileResult.data) {
              setUserProfile(profileResult.data);
            }
          });
        }
      }
    };

    checkProfileUpdates();
    const intervalId = setInterval(checkProfileUpdates, 5000);
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

  // Écoute les events CustomEvent depuis la navigation mobile
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
      setIsRegisterModalOpen(false);
    };
    const handleOpenRegisterModal = () => {
      setIsRegisterModalOpen(true);
      setIsLoginModalOpen(false);
    };
    window.addEventListener('openLoginModal', handleOpenLoginModal as EventListener);
    window.addEventListener('openRegisterModal', handleOpenRegisterModal as EventListener);
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal as EventListener);
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal as EventListener);
    };
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      ) : currentUser && userProfile ? (
        <UserMenu
          username={userProfile.username || 'Utilisateur'}
          imageUrl={userProfile.profileImageUrl}
        />
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={openLoginModal} className="gap-1.5">
            <LogIn className="h-4 w-4" />
            Connexion
          </Button>
          <Button size="sm" onClick={openRegisterModal} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            S'inscrire
          </Button>
        </div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={openRegisterModal}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={openLoginModal}
      />
    </>
  );
};

export default AuthButtons;
