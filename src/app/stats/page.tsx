'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import AppShell from '@/components/AppShell';
import EmptyState from '@/components/EmptyState';
import PageIntro from '@/components/PageIntro';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import StatsClient from './stats-client';

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

  const handleLoginClick = () => {
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };
  
  const handleRegisterClick = () => {
    const event = new CustomEvent('openRegisterModal');
    window.dispatchEvent(event);
  };

  // Afficher un spinner de chargement pendant la vérification d'authentification
  if (authLoading) {
    return (
      <AppShell>
        <div className="surface-panel rounded-[28px] px-6 py-16 text-center text-muted-foreground">
          Chargement des statistiques...
        </div>
      </AppShell>
    );
  }
  
  // Si l'utilisateur n'est pas connecté ET que l'authentification a été vérifiée, afficher le message
  if (authChecked && !user) {
    return (
      <AppShell>
        <PageIntro
          eyebrow="Statistiques"
          title="Mesurer ta bibliotheque, pas seulement la remplir."
          description="Connecte-toi pour analyser tes plateformes dominantes, tes genres recurrents et l'evolution de ta collection."
        />
        <EmptyState
          title="Connexion requise"
          description="Crée un compte ou connecte-toi pour débloquer ton dashboard personnel et suivre tes habitudes de jeu."
          actions={
            <>
              <Button variant="outline" className="gap-2 border-white/10 bg-white/5" onClick={handleLoginClick}>
                <LogIn className="h-4 w-4" />
                Connexion
              </Button>
              <Button className="gap-2" onClick={handleRegisterClick}>
                <UserPlus className="h-4 w-4" />
                S'inscrire
              </Button>
            </>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell contentClassName="space-y-6">
      <PageIntro
        eyebrow="Statistiques"
        title="Lire tes habitudes de jeu comme un tableau de bord vivant."
        description="Répartition par plateformes, genres dominants et progression de la collection dans un espace dédié à l'analyse."
      />
      {user && <StatsClient userId={user.uid} key={cacheKey} />}
    </AppShell>
  );
}
