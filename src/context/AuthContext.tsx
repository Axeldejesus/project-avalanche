'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { 
  onAuthStateChange, 
  getUserProfile, 
  logoutUser, 
  hasSessionExpired, 
  refreshSessionTimestamp 
} from '../services/authenticate';

// Interface pour le profil utilisateur
interface UserProfile {
  username: string;
  email: string;
  createdAt: string;
  profileImageUrl?: string;
  [key: string]: any; // Pour d'autres propriétés potentielles
}

// Interface pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

// Création du contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshUserProfile: async () => {}
});

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Provider du contexte d'authentification
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour rafraîchir les données du profil utilisateur
  const refreshUserProfile = async () => {
    if (user) {
      try {
        const profileResult = await getUserProfile(user.uid);
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data as UserProfile);
          // Rafraîchir le timestamp lors de la mise à jour du profil
          refreshSessionTimestamp();
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  // Vérifier l'expiration de la session
  useEffect(() => {
    if (user && hasSessionExpired()) {
      console.log("Session expired after 7 days. Logging out automatically.");
      
      // Afficher un message à l'utilisateur
      if (typeof window !== 'undefined') {
        alert("Your session has expired. For security reasons, you'll need to log in again.");
      }
      
      // Déconnecter l'utilisateur
      logoutUser().catch(error => {
        console.error('Error during automatic logout:', error);
      });
    }
  }, [user]);
  
  // Effet pour écouter les changements d'état d'authentification
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChange(async (authUser: User | null) => {
      setUser(authUser);
      
      if (authUser) {
        try {
          const profileResult = await getUserProfile(authUser.uid);
          if (profileResult.success && profileResult.data) {
            setUserProfile(profileResult.data as UserProfile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, []);

  // Écouter les changements du nom d'utilisateur dans le localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profileUsernameUpdated' && user) {
        refreshUserProfile();
      }
    };

    // Utiliser le localStorage pour les événements entre onglets
    window.addEventListener('storage', handleStorageChange);
    
    // Également utiliser un timer pour vérifier périodiquement les changements dans le même onglet
    const intervalId = setInterval(() => {
      const lastUpdate = localStorage.getItem('profileUsernameUpdated');
      if (lastUpdate && user) {
        const lastUpdateTime = parseInt(lastUpdate);
        const now = Date.now();
        // Si la mise à jour a eu lieu dans les 5 dernières secondes
        if (now - lastUpdateTime < 5000) {
          refreshUserProfile();
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [user]);

  // Rafraîchir le timestamp à intervalles réguliers pour les utilisateurs actifs
  useEffect(() => {
    if (!user) return;
    
    // Rafraîchir toutes les 24 heures pour les utilisateurs actifs
    const intervalId = setInterval(() => {
      refreshSessionTimestamp();
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  // Valeur du contexte
  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
