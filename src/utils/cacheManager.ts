/**
 * Gestionnaire de cache intelligent pour optimiser les lectures Firestore
 * Utilise sessionStorage (prioritaire) et localStorage (fallback) pour une meilleure persistance
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export class CacheManager {
  /**
   * Stocke des données en cache avec timestamp
   */
  static set<T>(key: string, data: T, useLocalStorage: boolean = false): void {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now()
    };
    
    const serialized = JSON.stringify(cacheData);
    
    try {
      // Toujours essayer sessionStorage en premier (plus rapide)
      sessionStorage.setItem(key, serialized);
      
      // Si demandé, aussi stocker dans localStorage pour persistance entre sessions
      if (useLocalStorage) {
        localStorage.setItem(key, serialized);
      }
    } catch (error) {
      console.warn('Cache storage failed:', error);
      // Si sessionStorage est plein, essayer de nettoyer
      this.clearOldEntries();
    }
  }
  
  /**
   * Récupère des données du cache si elles sont encore valides
   */
  static get<T>(key: string): T | null {
    try {
      // Essayer d'abord sessionStorage (plus récent)
      let cached = sessionStorage.getItem(key);
      
      // Si pas dans sessionStorage, essayer localStorage
      if (!cached) {
        cached = localStorage.getItem(key);
        
        // Si trouvé dans localStorage, le copier dans sessionStorage pour accès rapide
        if (cached) {
          sessionStorage.setItem(key, cached);
        }
      }
      
      if (!cached) return null;
      
      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Vérifier si le cache est encore valide
      if (now - cacheData.timestamp < CACHE_DURATION) {
        return cacheData.data;
      }
      
      // Cache expiré, le supprimer
      this.remove(key);
      return null;
      
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return null;
    }
  }
  
  /**
   * Supprime une entrée spécifique du cache
   */
  static remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Cache removal failed:', error);
    }
  }
  
  /**
   * Invalide plusieurs entrées liées à un pattern
   */
  static invalidatePattern(pattern: string): void {
    try {
      // SessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes(pattern)) {
          sessionStorage.removeItem(key);
        }
      }
      
      // LocalStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache pattern invalidation failed:', error);
    }
  }
  
  /**
   * Nettoie toutes les entrées expirées
   */
  static clearOldEntries(): void {
    try {
      const now = Date.now();
      
      // Nettoyer sessionStorage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        
        try {
          const cached = sessionStorage.getItem(key);
          if (!cached) continue;
          
          const cacheData: CacheData<any> = JSON.parse(cached);
          if (now - cacheData.timestamp >= CACHE_DURATION) {
            sessionStorage.removeItem(key);
          }
        } catch {
          // Si le parsing échoue, supprimer l'entrée
          sessionStorage.removeItem(key);
        }
      }
      
      // Nettoyer localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        try {
          const cached = localStorage.getItem(key);
          if (!cached) continue;
          
          const cacheData: CacheData<any> = JSON.parse(cached);
          if (now - cacheData.timestamp >= CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }
  
  /**
   * Vide complètement le cache (utile lors de déconnexion)
   */
  static clearAll(): void {
    try {
      // Ne supprimer que les clés liées à l'app (préfixe avalanche_)
      const keys = [
        'collectionCache',
        'collectionCacheTimestamp',
        'statsCache_',
        'statsCacheTimestamp_',
        'statsForceReload'
      ];
      
      keys.forEach(key => {
        this.invalidatePattern(key);
      });
    } catch (error) {
      console.warn('Cache clear all failed:', error);
    }
  }
}

// Nettoyer les entrées expirées au chargement de l'app
if (typeof window !== 'undefined') {
  CacheManager.clearOldEntries();
}
