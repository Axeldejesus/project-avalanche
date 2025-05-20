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
      // Utiliser des données de secours si IGDB échoue
      const fallbackPlatforms: Platform[] = [
        { id: 167, name: 'PlayStation 5', icon: '/playstation.png' },
        { id: 48, name: 'PlayStation 4', icon: '/playstation.png' },
        { id: 46, name: 'PlayStation 3', icon: '/playstation.png' },
        { id: 169, name: 'Xbox Series X|S', icon: '/xbox.png' },
        { id: 49, name: 'Xbox One', icon: '/xbox.png' },
        { id: 130, name: 'Nintendo Switch', icon: '/switch.png' },
        { id: 6, name: 'PC (Microsoft Windows)', icon: '/pc.png' }
      ];
      
      return NextResponse.json(fallbackPlatforms);
    }
  } catch (error) {
    console.error('Error fetching platforms:', error);
    
    // Utiliser des données de secours en cas d'erreur
    const fallbackPlatforms: Platform[] = [
      { id: 167, name: 'PlayStation 5', icon: '/playstation.png' },
      { id: 48, name: 'PlayStation 4', icon: '/playstation.png' },
      { id: 46, name: 'PlayStation 3', icon: '/playstation.png' },
      { id: 169, name: 'Xbox Series X|S', icon: '/xbox.png' },
      { id: 49, name: 'Xbox One', icon: '/xbox.png' },
      { id: 130, name: 'Nintendo Switch', icon: '/switch.png' },
      { id: 6, name: 'PC (Microsoft Windows)', icon: '/pc.png' }
    ];
    
    return NextResponse.json(fallbackPlatforms);
  }
}
