import React from 'react';
import { Star } from 'lucide-react';
import styles from '../styles/ModernGameCard.module.css';

interface Game {
  id: number;
  name: string;
  cover: string;
  rating: number;
  genres?: string;
}

interface GameCardProps {
  game: Game;
  onClick?: () => void;
}

const ModernGameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageContainer}>
        <img 
          src={game.cover} 
          alt={game.name} 
          className={styles.image}
          loading="lazy"
        />
        {game.rating > 0 && (
          <div className={styles.rating}>
            <Star size={12} fill="#FFD700" stroke="#FFD700" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{game.name}</h3>
        {game.genres && (
          <p className={styles.genres}>{game.genres}</p>
        )}
        <div className={styles.overlay}>
          <button className={styles.viewButton}>View Details</button>
        </div>
      </div>
    </div>
  );
};

export default ModernGameCard;
