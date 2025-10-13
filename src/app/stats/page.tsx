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
  const [cacheKey, setCacheKey] = useState<number>(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setAuthLoading(true);
    
    const authTimeout = setTimeout(() => {
      setAuthChecked(true);
      setAuthLoading(false);
    }, 1500);
    
    if (user) {
      clearTimeout(authTimeout);
      setAuthChecked(true);
      setAuthLoading(false);
      
      // Vérifier si on doit forcer un rechargement (après modification)
      const forceReload = sessionStorage.getItem('statsForceReload');
      if (forceReload === 'true') {
        sessionStorage.removeItem('statsForceReload');
        setCacheKey(Date.now()); // Force le rechargement
      }
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
      {user && <StatsClient userId={user.uid} key={cacheKey} />}
    </div>
  );
}
