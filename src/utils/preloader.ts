import { igdbRequest } from './igdb';
import cache from './cache';

/**
 * Précharge les données fréquemment consultées pour améliorer les performances
 */
export async function preloadPopularData(): Promise<void> {
  console.log('🚀 Préchargement des données populaires...');
  
  try {
    // Précharger les jeux les plus populaires
    await igdbRequest('games', `
      fields name, cover.image_id, total_rating, genres.name;
      where total_rating > 85;
      sort total_rating desc;
      limit 50;
    `, 7200); // Garder en cache pour 2 heures
    
    // Précharger les plateformes populaires
    await igdbRequest('platforms', `
      fields name;
      where id = (167, 169, 6, 130, 48, 49, 14, 3, 34, 39);
    `, 86400); // Garder en cache pour 24 heures (très statique)
    
    // Précharger les nouveautés récentes
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const sixtyDaysAgo = currentTimestamp - (60 * 86400);
    
    await igdbRequest('games', `
      fields name, cover.image_id, first_release_date, total_rating;
      where first_release_date > ${sixtyDaysAgo} & first_release_date < ${currentTimestamp} & cover.image_id != null;
      sort first_release_date desc;
      limit 10;
    `, 3600); // Garder en cache pour 1 heure
    
    console.log('✅ Préchargement terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur pendant le préchargement:', error);
  }
}
