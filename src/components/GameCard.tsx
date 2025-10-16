'use client';

import { useRouter, usePathname } from 'next/navigation';
import styles from '../styles/GameCard.module.css';

interface Game {
  id: number;
  name: string;
  cover: string;
  rating?: number;
  genres?: string;
}

interface GameCardProps {
  game: Game;
  onClick?: (id: number) => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleClick = () => {
    if (onClick) {
      onClick(game.id);
    } else {
      // Default behavior when onClick is not provided
      // Clear previous navigation flags
      sessionStorage.removeItem('cameFromGames');
      sessionStorage.removeItem('cameFromCollection');
      sessionStorage.removeItem('cameFromCustomList');
      sessionStorage.removeItem('cameFromProfile');
      
      // If we're on the home page, set the home flag
      if (pathname === '/') {
        sessionStorage.setItem('cameFromHome', 'true');
      }
      
      router.push(`/games/${game.id}`);
    }
  };
  
  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.imageContainer}>
        <img 
          src={game.cover} 
          alt={game.name} 
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{game.name}</h3>
      </div>
    </div>
  );
}
