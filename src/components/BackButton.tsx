'use client';

import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import styles from '../styles/GameDetail.module.css';
import { useEffect, useState } from 'react';

const BackButton: React.FC = () => {
  const router = useRouter();
  const [destination, setDestination] = useState('/');
  
  useEffect(() => {
    // Vérifier les flags de navigation
    const cameFromGames = sessionStorage.getItem('cameFromGames');
    const cameFromHome = sessionStorage.getItem('cameFromHome');
    const cameFromCalendar = sessionStorage.getItem('cameFromCalendar');
    
    if (cameFromGames === 'true') {
      setDestination('/games');
    } else if (cameFromHome === 'true' || cameFromCalendar === 'true') {
      // Si l'utilisateur vient de la page d'accueil ou de la modal du calendrier,
      // rediriger vers la page d'accueil
      setDestination('/');
    } else {
      setDestination('/');
    }
  }, []);
  
  const handleBack = () => {
    // Ne pas supprimer le flag 'cameFromCalendar' ici pour permettre
    // à la page d'accueil de détecter que l'utilisateur revient de la modal du calendrier
    router.push(destination);
  };
  
  return (
    <button 
      className={styles.backButton} 
      onClick={handleBack}
      aria-label="Back to previous page"
    >
      <FiArrowLeft /> Back
    </button>
  );
};

export default BackButton;
