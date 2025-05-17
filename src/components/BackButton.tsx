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
    const cameFromProfile = sessionStorage.getItem('cameFromProfile');
    const cameFromCollection = sessionStorage.getItem('cameFromCollection');
    
    if (cameFromGames === 'true') {
      setDestination('/games');
    } else if (cameFromHome === 'true' || cameFromCalendar === 'true') {
      // Si l'utilisateur vient de la page d'accueil ou de la modal du calendrier,
      // rediriger vers la page d'accueil
      setDestination('/');
    } else if (cameFromProfile === 'true') {
      // Si l'utilisateur vient de la page de profil, rediriger vers la page de profil
      setDestination('/profile');
    } else if (cameFromCollection === 'true') {
      // Si l'utilisateur vient de la page de collection, rediriger vers la page de collection
      setDestination('/collections');
    } else {
      setDestination('/');
    }
  }, []);
  
  const handleBack = () => {
    // Ne pas supprimer les flags 'cameFromCalendar' pour permettre
    // à la page d'accueil de détecter que l'utilisateur revient de la modal du calendrier
    
    // Nettoyer le flag 'cameFromProfile' après utilisation
    if (destination === '/profile') {
      sessionStorage.removeItem('cameFromProfile');
    }
    
    // Nettoyer le flag 'cameFromCollection' après utilisation
    if (destination === '/collections') {
      sessionStorage.removeItem('cameFromCollection');
    }
    
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
