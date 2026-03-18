'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const BackButton: React.FC = () => {
  const router = useRouter();
  const [destination, setDestination] = useState('/');
  
  useEffect(() => {
    // Vérifier les flags de navigation
    const cameFromGames = sessionStorage.getItem('cameFromGames');
    const cameFromHome = sessionStorage.getItem('cameFromHome');
    const cameFromCalendar = sessionStorage.getItem('cameFromCalendar');
    const cameFromProfile = sessionStorage.getItem('cameFromProfile');
    const cameFromCollection = sessionStorage.getItem('cameFromCollection');
    const cameFromCustomList = sessionStorage.getItem('cameFromCustomList');
    
    if (cameFromGames === 'true') {
      setDestination('/games');
    } else if (cameFromCustomList) {
      // Si on vient d'une custom list, on retourne à /collections
      // et on garde l'ID de la liste pour la restaurer
      setDestination('/collections');
    } else if (cameFromCollection === 'true') {
      setDestination('/collections');
    } else if (cameFromHome === 'true' || cameFromCalendar === 'true') {
      setDestination('/');
    } else if (cameFromProfile === 'true') {
      setDestination('/profile');
    } else {
      setDestination('/');
    }
  }, []);
  
  const handleBack = () => {
    const cameFromCustomList = sessionStorage.getItem('cameFromCustomList');
    
    if (destination === '/profile') {
      sessionStorage.removeItem('cameFromProfile');
    }
    
    if (destination === '/collections') {
      // Si on vient d'une custom list, on garde le flag pour restaurer la liste
      if (cameFromCustomList) {
        // Créer un flag pour indiquer qu'on doit restaurer la liste active
        sessionStorage.setItem('restoreListId', cameFromCustomList);
        sessionStorage.setItem('restoreListTab', 'lists');
      }
      sessionStorage.removeItem('cameFromCollection');
      sessionStorage.removeItem('cameFromCustomList');
    }
    
    // Keep scroll position and game filters in sessionStorage
    // They will be used by the games page to restore state
    
    router.push(destination);
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 rounded-full border-white/10 bg-black/20 px-4 text-sm text-foreground hover:bg-white/5"
      onClick={handleBack}
      aria-label="Back to previous page"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </Button>
  );
};

export default BackButton;
