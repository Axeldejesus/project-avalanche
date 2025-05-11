'use client';

import { useState, useEffect } from 'react';
import GameVideo from './GameVideo';
import styles from '../styles/GameVideo.module.css';
import { FaVideo } from 'react-icons/fa';

interface Video {
  id: number;
  name: string;
  videoId: string;
  thumbnailUrl: string;
}

interface GameVideosProps {
  gameId: number;
}

const GameVideos: React.FC<GameVideosProps> = ({ gameId }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/game-videos/${gameId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        
        const data = await response.json();
        setVideos(data);
      } catch (err) {
        console.error('Error loading videos:', err);
        setError('Could not load videos at this time');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchVideos();
    }
  }, [gameId]);

  if (loading) {
    return <div>Loading videos...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos
  }

  return (
    <div className={styles.videoSection}>
      <h2 className={styles.videoSectionTitle}>
        <FaVideo className={styles.videoSectionIcon} />
        Game Videos
      </h2>
      <div className={styles.videoGrid}>
        {videos.map((video) => (
          <GameVideo
            key={video.id}
            videoId={video.videoId}
            title={video.name}
            thumbnailUrl={video.thumbnailUrl}
          />
        ))}
      </div>
    </div>
  );
};

export default GameVideos;
