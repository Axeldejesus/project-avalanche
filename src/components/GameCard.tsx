'use client';

import { useRouter } from 'next/navigation';
import styles from '../styles/GameCard.module.css';

interface Game {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres?: string;
}

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/games/${game.id}`);
  };
  
  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.imageContainer}>
        <img src={game.cover} alt={game.name} className={styles.image} />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{game.name}</h3>
        <div className={styles.meta}>
          <div className={styles.rating}>{game.rating.toFixed(1)}</div>
          <div className={styles.genre}>{game.genres}</div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
