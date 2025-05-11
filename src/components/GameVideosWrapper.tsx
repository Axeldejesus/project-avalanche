'use client';

import dynamic from 'next/dynamic';

// Dynamic import within client component where ssr: false is allowed
const GameVideos = dynamic(() => import('./GameVideos'), {
  loading: () => <div>Chargement des vidéos...</div>,
  ssr: false // Avoiding hydration errors is allowed here
});

interface GameVideosWrapperProps {
  gameId: number;
}

const GameVideosWrapper: React.FC<GameVideosWrapperProps> = ({ gameId }) => {
  return <GameVideos gameId={gameId} />;
};

export default GameVideosWrapper;
