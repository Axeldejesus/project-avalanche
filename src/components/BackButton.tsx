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
    
    if (cameFromGames === 'true') {
      setDestination('/games');
    } else if (cameFromHome === 'true') {
      setDestination('/');
    } else {
      setDestination('/');
    }
  }, []);
  
  const handleBack = () => {
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
