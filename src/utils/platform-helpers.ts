/**
 * Retourne une icône de plateforme de secours basée sur le nom
 */
export function getPlatformFallbackIcon(platformName: string): string {
  const normalizedName = platformName.toLowerCase();
  
  if (normalizedName.includes('playstation') || normalizedName.includes('ps5') || normalizedName.includes('ps4')) {
    return '/playstation.png';
  } else if (normalizedName.includes('xbox')) {
    return '/xbox.png';
  } else if (normalizedName.includes('nintendo') || normalizedName.includes('switch')) {
    return '/switch.png';
  } else if (normalizedName.includes('pc')) {
    return '/pc.png';
  }
  return '/platform-generic.png'; // Icône générique en dernier recours
}

/**
 * Map des IDs de plateformes connues vers des icônes personnalisées
 */
export const PLATFORM_ICONS: Record<number, string> = {
  167: '/playstation.png', // PS5
  48: '/playstation.png',  // PS4
  169: '/xbox.png',        // Xbox Series X
  49: '/xbox.png',         // Xbox One
  130: '/switch.png',      // Nintendo Switch
  6: '/pc.png',            // PC
};
