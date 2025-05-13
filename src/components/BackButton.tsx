'use client';

import { useRouter, usePathname } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import styles from '../styles/GameDetail.module.css';

interface BackButtonProps {
  className?: string;
}

export default function BackButton({ className }: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleBack = () => {
    // If we're on a game detail page
    if (pathname.startsWith('/games/') && pathname.split('/').length > 2) {
      if (sessionStorage.getItem('cameFromGames') === 'true') {
        // User came from games list
        router.push('/games');
      } else if (sessionStorage.getItem('cameFromHome') === 'true') {
        // User came from home
        router.push('/');
      } else {
        // Default fallback
        router.back();
      }
    } else {
      // Default fallback
      router.back();
    }
  };

  return (
    <button onClick={handleBack} className={`${styles.backButton} ${className || ''}`}>
      <FiArrowLeft /> Back
    </button>
  );
}
