/**
 * Retourne une icône de plateforme de secours basée sur le nom
 */
export function getPlatformFallbackIcon(platformName: string): string {
  if (platformName.includes('PlayStation') || platformName.includes('PS5')) {
    return '/playstation.png';
  } else if (platformName.includes('Xbox')) {
    return '/xbox.png';
  } else if (platformName.includes('Nintendo') || platformName.includes('Switch')) {
    return '/switch.png';
  } else if (platformName.includes('PC')) {
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
