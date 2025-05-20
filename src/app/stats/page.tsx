'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import StatsClient from './stats-client';
import styles from './stats.module.css';

export default function StatsPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Considérer l'authentification comme en cours de chargement par défaut
    setAuthLoading(true);
    
    // Définir un délai avant de considérer que l'utilisateur n'est pas authentifié
    const authTimeout = setTimeout(() => {
      setAuthChecked(true);
      setAuthLoading(false);
    }, 1500); // Attendre 1.5 secondes
    
    if (user) {
      // Si l'utilisateur est connecté, effacer le délai et charger les données
      clearTimeout(authTimeout);
      setAuthChecked(true);
      setAuthLoading(false);
    }
    
    return () => clearTimeout(authTimeout);
  }, [user]);

  // Afficher un spinner de chargement pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Si l'utilisateur n'est pas connecté ET que l'authentification a été vérifiée, afficher le message
  if (authChecked && !user) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.notLoggedIn}>
          <h2>Sign in to view your statistics</h2>
          <p>Create an account to track statistics about your gaming habits and preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      {user && <StatsClient userId={user.uid} />}
    </div>
  );
}
