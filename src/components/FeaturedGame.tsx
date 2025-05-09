import styles from '../styles/FeaturedGame.module.css';

interface FeaturedGameType {
  id: number;
  name: string;
  cover: string;
  background?: string; // Rendre background optionnel
  description: string;
  rating: number;
  reviews?: number;
}

interface FeaturedGameProps {
  game: FeaturedGameType;
}

const FeaturedGame: React.FC<FeaturedGameProps> = ({ game }) => {
  // Utiliser une valeur par défaut pour background s'il est undefined
  const backgroundImage = game.background || '/placeholder-background.jpg';
  
  return (
    <div className={styles.featured} style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className={styles.content}>
        <div className={styles.rating}>
          <div className={styles.stars}>
            {Array(5).fill(0).map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < Math.floor(game.rating) ? "currentColor" : "none"} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <div className={styles.ratingValue}>{game.rating.toFixed(1)} ({game.reviews || 0} reviews)</div>
        </div>

        <h1 className={styles.title}>{game.name}</h1>
        <p className={styles.description}>{game.description}</p>
        
        <div className={styles.actions}>
          <button className={styles.primaryBtn}>View Game</button>
          <button className={styles.secondaryBtn}>Add to Favorites</button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedGame;
