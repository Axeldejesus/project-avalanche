type CacheItem<T> = {
  data: T;
  expiry: number;
};

class Cache {
  private cache: Record<string, CacheItem<any>> = {};

  /**
   * Obtient une valeur du cache
   * @param key Clé de cache
   * @returns Données en cache ou null si absentes/expirées
   */
  get<T>(key: string): T | null {
    const item = this.cache[key];
    
    // Vérifier si l'élément existe et n'est pas expiré
    if (item && Date.now() < item.expiry) {
      console.log(`🔄 Cache hit: ${key}`);
      return item.data as T;
    }
    
    // Si l'élément est expiré, le supprimer
    if (item) {
      console.log(`⌛ Cache expired: ${key}`);
      delete this.cache[key];
    }
    
    return null;
  }

  /**
   * Met une valeur en cache
   * @param key Clé de cache
   * @param data Données à mettre en cache
   * @param ttlSeconds Durée de vie en secondes (par défaut 10 minutes)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 600): void {
    console.log(`📝 Cache set: ${key} (TTL: ${ttlSeconds}s)`);
    this.cache[key] = {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    };
  }

  /**
   * Supprime une clé du cache
   * @param key Clé à supprimer
   */
  delete(key: string): void {
    delete this.cache[key];
  }

  /**
   * Vide le cache entier
   */
  clear(): void {
    this.cache = {};
  }
}

// Créer une instance singleton
const cacheInstance = new Cache();
export default cacheInstance;
