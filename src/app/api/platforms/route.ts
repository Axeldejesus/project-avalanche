import { NextResponse } from 'next/server';
import { igdbRequest } from '../../../utils/igdb';

interface IPlatform {
  id: number;
  name: string;
}

interface Platform {
  id: number;
  name: string;
  icon: string;
}

// Map des IDs de plateformes connues vers des icônes personnalisées
const PLATFORM_ICONS: Record<number, string> = {
  167: '/playstation.png', // PS5
  169: '/xbox.png',        // Xbox Series X
  130: '/switch.png',      // Nintendo Switch
  6: '/pc.png',            // PC
};

export async function GET(): Promise<NextResponse<Platform[]>> {
  try {
    // Ciblons spécifiquement les plateformes les plus populaires par ID
    const platforms = await igdbRequest<IPlatform>('platforms', `
      fields name;
      where id = (167, 169, 6, 130);
    `);
    
    if (platforms && platforms.length > 0) {
      const formattedPlatforms: Platform[] = platforms.map(platform => {
        return {
          id: platform.id,
          name: platform.name,
          icon: PLATFORM_ICONS[platform.id] || '/platform-generic.png'
        };
      });
      
      return NextResponse.json(formattedPlatforms);
    } else {
      // Return fallback data
      const fallbackPlatforms: Platform[] = [
        { id: 167, name: "PlayStation 5", icon: "/playstation.png" },
        { id: 169, name: "Xbox Series X", icon: "/xbox.png" },
        { id: 6, name: "PC", icon: "/pc.png" },
        { id: 130, name: "Nintendo Switch", icon: "/switch.png" }
      ];
      
      return NextResponse.json(fallbackPlatforms);
    }
  } catch (error) {
    console.error('Error fetching platforms:', error);
    
    // Fallback data on error
    const fallbackPlatforms: Platform[] = [
      { id: 167, name: "PlayStation 5", icon: "/playstation.png" },
      { id: 169, name: "Xbox Series X", icon: "/xbox.png" },
      { id: 6, name: "PC", icon: "/pc.png" },
      { id: 130, name: "Nintendo Switch", icon: "/switch.png" }
    ];
    
    return NextResponse.json(fallbackPlatforms);
  }
}
