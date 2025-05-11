'use client';

import { useState } from 'react';
import styles from '../styles/GameVideo.module.css';
import { FaYoutube, FaPlay } from 'react-icons/fa';

interface GameVideoProps {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

const GameVideo: React.FC<GameVideoProps> = ({ videoId, title, thumbnailUrl }) => {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
  };

  return (
    <div className={styles.videoCard}>
      {playing ? (
        <div className={styles.videoWrapper}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.videoIframe}
          ></iframe>
        </div>
      ) : (
        <div className={styles.thumbnailContainer} onClick={handlePlay}>
          <img
            src={thumbnailUrl}
            alt={title}
            className={styles.thumbnail}
          />
          <div className={styles.playButton}>
            <FaPlay />
          </div>
          <div className={styles.videoTitle}>
            <FaYoutube className={styles.youtubeIcon} />
            <span>{title}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameVideo;
