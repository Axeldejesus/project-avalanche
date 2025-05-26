import { db, auth } from './authenticate';
import { collection, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, startAfter, DocumentSnapshot, setDoc,} from 'firebase/firestore';
import { 
  CollectionItemSchema, 
  CollectionStatsSchema, 
  AddToCollectionInputSchema, 
  UpdateCollectionInputSchema,
  type CollectionItem,
  type CollectionStats,
  type AddToCollectionInput,
  type UpdateCollectionInput
} from '../schemas';

// Add a game to the user's collection
export const addToCollection = async (
  collectionData: AddToCollectionInput & { userId: string }
): Promise<{ success: boolean; error?: string; collectionId?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate input with Zod
    const validatedData = AddToCollectionInputSchema.extend({
      userId: CollectionItemSchema.shape.userId
    }).parse(collectionData);

    const userId = auth.currentUser.uid;
    const now = new Date().toISOString();
    
    // Récupérer les détails du jeu depuis l'API pour obtenir les genres et plateformes
    let gameDetails;
    try {
      // Supprimer le paramètre userId qui n'est plus nécessaire
      const response = await fetch(`/api/game-details?id=${collectionData.gameId}`);
      if (response.ok) {
        gameDetails = await response.json();
      }
    } catch (err) {
      console.error('Error fetching game details:', err);
      // On continue même si on ne peut pas récupérer les détails
    }
    
    // Check if game already exists in collection first
    const existingItem = await getUserGameInCollection(userId, validatedData.gameId);
    
    if (existingItem) {
      // Game exists, update its status instead
      const collectionRef = doc(db!, `collections/${userId}/games`, existingItem.id!);
      
      // Create update object only with defined fields to avoid Firestore errors
      const updateData: any = {
        status: validatedData.status,
        updatedAt: now
      };
      
      // Only include these fields if they are defined
      if (validatedData.notes !== undefined) {
        updateData.notes = validatedData.notes;
      }
      
      if (validatedData.rating !== undefined) {
        updateData.rating = validatedData.rating;
      }
      
      if (validatedData.hoursPlayed !== undefined) {
        updateData.hoursPlayed = validatedData.hoursPlayed;
      }
      
      // Ajouter les informations de plateforme et de genre automatiquement si disponibles
      if (gameDetails) {
        // Plateforme principale (préférée ou première)
        updateData.platform = gameDetails.platform;
        // Toutes les plateformes disponibles
        updateData.platforms = gameDetails.platforms || [];
        // Genre principal
        updateData.genre = gameDetails.genre;
        // Tous les genres
        updateData.genres = gameDetails.genres || [];
      }
      
      await updateDoc(collectionRef, updateData);
      
      return { success: true, collectionId: existingItem.id };
    }
    
    // Game doesn't exist, create new entry
    // Use gameId as document ID for easier lookup
    const gameDocId = validatedData.gameId.toString();
    const collectionRef = doc(db!, `collections/${userId}/games`, gameDocId);
    
    // Create a clean object without undefined values
    const newGameData: Omit<CollectionItem, 'id'> = {
      userId,
      gameId: validatedData.gameId,
      gameName: validatedData.gameName,
      gameCover: validatedData.gameCover,
      status: validatedData.status,
      addedAt: now,
      updatedAt: now
    };
    
    // Ajouter les informations de plateforme et de genre automatiquement si disponibles
    if (gameDetails) {
      // Plateforme principale (préférée ou première)
      newGameData.platform = gameDetails.platform;
      // Toutes les plateformes disponibles
      newGameData.platforms = gameDetails.platforms || [];
      // Genre principal
      newGameData.genre = gameDetails.genre;
      // Tous les genres
      newGameData.genres = gameDetails.genres || [];
    }
    
    // Only add optional fields if they're defined
    if (validatedData.notes !== undefined) {
      (newGameData as any).notes = validatedData.notes;
    }
    
    if (validatedData.rating !== undefined) {
      (newGameData as any).rating = validatedData.rating;
    }
    
    if (validatedData.hoursPlayed !== undefined) {
      (newGameData as any).hoursPlayed = validatedData.hoursPlayed;
    }
    
    await setDoc(collectionRef, newGameData);

    return { success: true, collectionId: gameDocId };
  } catch (error: any) {
    console.error('Error adding to collection:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        success: false, 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Update a game in the collection
export const updateCollection = async (
  gameId: number,
  data: UpdateCollectionInput
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate inputs with Zod
    const validatedGameId = CollectionItemSchema.shape.gameId.parse(gameId);
    const validatedData = UpdateCollectionInputSchema.parse(data);

    const userId = auth.currentUser.uid;
    const gameDocId = validatedGameId.toString();
    const collectionRef = doc(db!, `collections/${userId}/games`, gameDocId);
    
    const collectionSnap = await getDoc(collectionRef);
    if (!collectionSnap.exists()) {
      return { success: false, error: 'Game not found in collection' };
    }

    await updateDoc(collectionRef, {
      ...validatedData,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating collection:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        success: false, 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Remove a game from the collection
export const removeFromCollection = async (gameId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const userId = auth.currentUser.uid;
    const gameDocId = gameId.toString();
    const collectionRef = doc(db!, `collections/${userId}/games`, gameDocId);
    
    const collectionSnap = await getDoc(collectionRef);
    if (!collectionSnap.exists()) {
      return { success: false, error: 'Game not found in collection' };
    }

    await deleteDoc(collectionRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error removing from collection:', error);
    return { success: false, error: error.message };
  }
};

// Get all games in collection for a user with optional status filter
export const getUserCollection = async (
  userId: string,
  status?: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{
  items: CollectionItem[];
  lastDoc?: DocumentSnapshot;
  hasMore: boolean;
  error?: string;
}> => {
  try {
    if (!db) {
      return { items: [], hasMore: false, error: 'Database not initialized' };
    }

    // Validate inputs
    const validatedUserId = CollectionItemSchema.shape.userId.parse(userId);
    if (status) {
      CollectionItemSchema.shape.status.parse(status);
    }

    // Build the query with proper ordering
    let collectionQuery = query(
      collection(db, `collections/${userId}/games`),
      orderBy('updatedAt', 'desc')
    );

    // Apply status filter if provided
    if (status) {
      collectionQuery = query(
        collection(db, `collections/${userId}/games`),
        where('status', '==', status),
        orderBy('updatedAt', 'desc')
      );
    }

    // Apply pagination
    if (lastDoc) {
      collectionQuery = query(collectionQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      collectionQuery = query(collectionQuery, limit(pageSize));
    }

    const collectionSnapshot = await getDocs(collectionQuery);
    const items: CollectionItem[] = [];
    let newLastDoc: DocumentSnapshot | undefined;

    collectionSnapshot.forEach((doc) => {
      newLastDoc = doc;
      try {
        // Validate collection item data from Firestore
        const itemData = CollectionItemSchema.parse({
          id: doc.id,
          ...doc.data()
        });
        items.push(itemData);
      } catch (validationError) {
        console.error('Invalid collection item data in Firestore:', validationError);
        // Skip invalid items rather than failing the entire request
      }
    });

    const hasMore = items.length === pageSize;
    return { items, lastDoc: newLastDoc, hasMore };
  } catch (error: any) {
    console.error('Error getting collection:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        items: [], 
        hasMore: false, 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { items: [], hasMore: false, error: error.message };
  }
};

// Check if a game is in the user's collection and get its details
export const getUserGameInCollection = async (
  userId: string,
  gameId: number
): Promise<CollectionItem | null> => {
  try {
    if (!db) {
      return null;
    }

    // Validate inputs
    const validatedUserId = CollectionItemSchema.shape.userId.parse(userId);
    const validatedGameId = CollectionItemSchema.shape.gameId.parse(gameId);

    const gameDocId = validatedGameId.toString();
    const collectionRef = doc(db, `collections/${validatedUserId}/games`, gameDocId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      return null;
    }

    try {
      // Validate collection item data from Firestore
      return CollectionItemSchema.parse({
        id: collectionDoc.id,
        ...collectionDoc.data()
      });
    } catch (validationError) {
      console.error('Invalid collection item data in Firestore:', validationError);
      return null;
    }
  } catch (error: any) {
    console.error('Error checking game in collection:', error);
    return null;
  }
};

// Get collection statistics for a user (count by status)
export const getUserCollectionStats = async (
  userId: string
): Promise<CollectionStats & { error?: string }> => {
  try {
    if (!db) {
      return { 
        total: 0, completed: 0, playing: 0, 
        toPlay: 0, abandoned: 0, wishlist: 0,
        error: 'Database not initialized' 
      };
    }

    // Validate userId
    const validatedUserId = CollectionItemSchema.shape.userId.parse(userId);

    const collectionSnapshot = await getDocs(collection(db, `collections/${validatedUserId}/games`));
    
    let stats: CollectionStats = {
      total: 0,
      completed: 0,
      playing: 0,
      toPlay: 0,
      abandoned: 0,
      wishlist: 0
    };
    
    collectionSnapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      // Increment the appropriate status counter
      if (data.status === 'completed') stats.completed++;
      else if (data.status === 'playing') stats.playing++;
      else if (data.status === 'toPlay') stats.toPlay++;
      else if (data.status === 'abandoned') stats.abandoned++;
      else if (data.status === 'wishlist') stats.wishlist++;
    });
    
    // Validate stats before returning
    return CollectionStatsSchema.parse(stats);
  } catch (error: any) {
    console.error('Error getting collection stats:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        total: 0, completed: 0, playing: 0, 
        toPlay: 0, abandoned: 0, wishlist: 0,
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { 
      total: 0, completed: 0, playing: 0, 
      toPlay: 0, abandoned: 0, wishlist: 0,
      error: error.message 
    };
  }
};

// Nouvelle fonction pour récupérer tous les jeux d'un utilisateur pour l'analyse statistique
export const getUserCollectionForStats = async (
  userId: string
): Promise<{ items: CollectionItem[]; error?: string }> => {
  try {
    if (!db) {
      return { items: [], error: 'Database not initialized' };
    }

    // Correction du chemin de collection pour correspondre aux autres fonctions
    const collectionRef = collection(db, `collections/${userId}/games`);
    const q = query(collectionRef, orderBy('addedAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    
    const items: CollectionItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as CollectionItem;
      items.push({
        ...data,
        id: doc.id
      });
    });
    
    console.log(`Fetched ${items.length} games for statistics`);
    return { items };
  } catch (error: any) {
    console.error('Error getting collection for stats:', error);
    return { items: [], error: error.message };
  }
};
export { CollectionItem };

