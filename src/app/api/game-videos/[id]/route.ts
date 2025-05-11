import { NextResponse } from 'next/server';
import { igdbRequest } from '../../../../utils/igdb';

interface IGameVideo {
  id: number;
  name: string;
  video_id: string;
  game: number;
}

interface GameVideo {
  id: number;
  name: string;
  videoId: string;
  thumbnailUrl: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const gameId = id;
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    const videos = await igdbRequest<IGameVideo>('game_videos', `
      fields name, video_id, game;
      where game = ${gameId};
      limit 5;
    `);
    
    if (videos && videos.length > 0) {
      const formattedVideos: GameVideo[] = videos.map(video => ({
        id: video.id,
        name: video.name,
        videoId: video.video_id,
        thumbnailUrl: `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
      }));
      
      return NextResponse.json(formattedVideos);
    } else {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching game videos:', error);
    return NextResponse.json({ error: 'Failed to fetch game videos' }, { status: 500 });
  }
}
