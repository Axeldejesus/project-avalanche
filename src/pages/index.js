import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Sidebar from '../components/Sidebar';
import GameCard from '../components/GameCard';
import FeaturedGame from '../components/FeaturedGame';

export default function Home({ featuredGame, recommendedGames, topRatedGames, upcomingGames }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>GameCritic - Discover Amazing Games</title>
        <meta name="description" content="Browse and discover amazing video games" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="GameCritic" width={150} height={30} />
        </div>
        
        <nav className={styles.nav}>
          <a className={styles.active}>Home</a>
          <a>Trending</a>
          <a>New Releases</a>
          <a>Collections</a>
        </nav>
        
        <div className={styles.search}>
          <input type="text" placeholder="Search games..." />
          <button>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        
        <div className={styles.userMenu}>
          <button className={styles.userButton}>
            <span className={styles.userIcon}>J</span>
          </button>
        </div>
      </header>

      <div className={styles.mainLayout}>
        <Sidebar />
        
        <main className={styles.main}>
          <FeaturedGame game={featuredGame} />
          
          <section className={styles.gameSection}>
            <div className={styles.sectionHeader}>
              <h2>Recommended For You</h2>
              <a href="#" className={styles.viewAll}>View All <span>→</span></a>
            </div>
            <div className={styles.gameGrid}>
              {recommendedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
          
          <section>
            <div className={styles.sectionHeader}>
              <h2>Discover Games</h2>
            </div>
            
            <div className={styles.discover}>
              <div className={styles.discoverSection}>
                <h3>Top Rated</h3>
                {topRatedGames.slice(0, 5).map((game, index) => (
                  <div key={game.id} className={styles.rankCard}>
                    <div className={styles.rank}>{index + 1}</div>
                    <div className={styles.rankGame}>
                      <img src={game.cover} alt={game.name} />
                      <div>
                        <h4>{game.name}</h4>
                        <div className={styles.rating}>{game.rating.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.discoverSection}>
                <h3>Upcoming Releases</h3>
                {upcomingGames.slice(0, 5).map((game) => (
                  <div key={game.id} className={styles.releaseCard}>
                    <img src={game.cover} alt={game.name} />
                    <div>
                      <h4>{game.name}</h4>
                      <div className={styles.releaseDate}>{new Date(game.release_date * 1000).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    // Fetch data from our API routes that will connect to IGDB
    const [featuredRes, recommendedRes, topRatedRes, upcomingRes] = await Promise.all([
      fetch('http://localhost:3000/api/featured-game'),
      fetch('http://localhost:3000/api/recommended-games'),
      fetch('http://localhost:3000/api/top-rated-games'),
      fetch('http://localhost:3000/api/upcoming-games')
    ]);

    // Create fallback data
    const fallbackFeaturedGame = {
      id: 123,
      name: 'Stellar Odyssey 2025',
      cover: '/placeholder-cover.jpg',
      background: '/placeholder-background.jpg',
      description: 'An epic space adventure that combines the boundaries of gaming with stunning visuals and an immersive storyline. Explore unknown galaxies and forge your own path among the stars.',
      rating: 4.5
    };
    
    const fallbackRecommendedGames = Array(4).fill().map((_, i) => ({
      id: i + 1,
      name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
      cover: '/placeholder-cover.jpg',
      rating: 4.0 + Math.random(),
      genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
    }));
    
    const fallbackTopRatedGames = Array(5).fill().map((_, i) => ({
      id: 100 + i,
      name: `Top Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      rating: 4.5 + (Math.random() * 0.5)
    }));
    
    const fallbackUpcomingGames = Array(5).fill().map((_, i) => ({
      id: 200 + i,
      name: `Upcoming Game ${i+1}`,
      cover: '/placeholder-cover.jpg',
      release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30)
    }));

    // Parse JSON responses
    let [featuredGame, recommendedGames, topRatedGames, upcomingGames] = await Promise.all([
      featuredRes.json(),
      recommendedRes.json(),
      topRatedRes.json(),
      upcomingRes.json()
    ]);

    // Validate responses and use fallbacks if needed
    if (!featuredGame || featuredGame.error) featuredGame = fallbackFeaturedGame;
    if (!Array.isArray(recommendedGames)) recommendedGames = fallbackRecommendedGames;
    if (!Array.isArray(topRatedGames)) topRatedGames = fallbackTopRatedGames;
    if (!Array.isArray(upcomingGames)) upcomingGames = fallbackUpcomingGames;

    return {
      props: {
        featuredGame,
        recommendedGames,
        topRatedGames,
        upcomingGames
      }
    };
  } catch (error) {
    console.error('Error fetching game data:', error);
    
    return {
      props: {
        featuredGame: {
          id: 123,
          name: 'Stellar Odyssey 2025',
          cover: '/placeholder-cover.jpg',
          background: '/placeholder-background.jpg',
          description: 'An epic space adventure that combines the boundaries of gaming with stunning visuals and an immersive storyline. Explore unknown galaxies and forge your own path among the stars.',
          rating: 4.5
        },
        recommendedGames: Array(4).fill().map((_, i) => ({
          id: i + 1,
          name: ['Dragon\'s Legacy', 'Velocity Surge', 'Tactical Force', 'Chromatic Puzzle'][i],
          cover: '/placeholder-cover.jpg',
          rating: 4.0 + Math.random(),
          genres: ['RPG', 'Racing', 'FPS', 'Puzzle'][i]
        })),
        topRatedGames: Array(5).fill().map((_, i) => ({
          id: 100 + i,
          name: `Top Game ${i+1}`,
          cover: '/placeholder-cover.jpg',
          rating: 4.5 + (Math.random() * 0.5)
        })),
        upcomingGames: Array(5).fill().map((_, i) => ({
          id: 200 + i,
          name: `Upcoming Game ${i+1}`,
          cover: '/placeholder-cover.jpg',
          release_date: Math.floor(Date.now()/1000) + (i * 86400 * 30)
        }))
      }
    };
  }
}
