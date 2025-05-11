import { NextResponse } from 'next/server';
import { igdbRequest } from '../../../utils/igdb';
import { PLATFORM_ICONS, getPlatformFallbackIcon } from '../../../utils/platform-helpers';

interface IPlatform {
  id: number;
  name: string;
}

interface Platform {
  id: number;
  name: string;
  icon: string;
}

export async function GET(): Promise<NextResponse<Platform[]>> {
  try {
    // Ciblons spécifiquement les plateformes les plus populaires par ID
    const platforms = await igdbRequest<IPlatform>('platforms', `
      fields name;
      where id = (167, 169, 6, 130, 48, 49, 14, 3, 34, 39);
    `);
    
    if (platforms && platforms.length > 0) {
      const formattedPlatforms: Platform[] = platforms.map((platform: IPlatform) => {
        return {
          id: platform.id,
          name: platform.name,
          icon: PLATFORM_ICONS[platform.id] || getPlatformFallbackIcon(platform.name)
        };
      });
      
      return NextResponse.json(formattedPlatforms);
    } else {
      console.error('No platforms data received from IGDB');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json([]);
  }
}
