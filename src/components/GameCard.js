import styles from '../styles/GameCard.module.css';

const GameCard = ({ game }) => {
  return (
    <div className={styles.card}>
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
