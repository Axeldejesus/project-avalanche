import { 
  SiPlaystation, 
  SiNintendoswitch, 
  SiMacos, 
  SiLinux, 
  SiAndroid, 
  SiIos,
  SiSteam
} from 'react-icons/si';
import { FaWindows, FaXbox } from 'react-icons/fa';
import { BsController, BsPhone, BsQuestionCircle } from 'react-icons/bs';
import { IconType } from 'react-icons';

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

/**
 * Map des icônes React pour les plateformes
 */
export const PLATFORM_REACT_ICONS: Record<number, IconType> = {
  167: SiPlaystation, // PS5
  48: SiPlaystation,  // PS4
  169: FaXbox,        // Xbox Series X
  49: FaXbox,         // Xbox One
  130: SiNintendoswitch, // Nintendo Switch
  6: FaWindows,       // PC
  14: SiMacos,        // Mac
  3: SiLinux,         // Linux
  34: SiAndroid,      // Android
  39: SiIos,          // iOS
  92: SiSteam,        // Steam
};

/**
 * Retourne une icône React pour une plateforme basée sur son ID ou son nom
 */
export function getPlatformReactIcon(platformId?: number, platformName?: string): IconType {
  if (platformId && PLATFORM_REACT_ICONS[platformId]) {
    return PLATFORM_REACT_ICONS[platformId];
  }
  
  if (platformName) {
    const normalizedName = platformName.toLowerCase();
    
    if (normalizedName.includes('playstation') || normalizedName.includes('ps')) {
      return SiPlaystation;
    } else if (normalizedName.includes('xbox')) {
      return FaXbox;
    } else if (normalizedName.includes('nintendo') || normalizedName.includes('switch')) {
      return SiNintendoswitch;
    } else if (normalizedName.includes('pc') || normalizedName.includes('windows')) {
      return FaWindows;
    } else if (normalizedName.includes('mac')) {
      return SiMacos;
    } else if (normalizedName.includes('linux')) {
      return SiLinux;
    } else if (normalizedName.includes('android')) {
      return SiAndroid;
    } else if (normalizedName.includes('ios') || normalizedName.includes('iphone')) {
      return SiIos;
    } else if (normalizedName.includes('mobile')) {
      return BsPhone;
    } else if (normalizedName.includes('steam')) {
      return SiSteam;
    }
  }
  
  return BsController; // Icône générique en dernier recours
}
