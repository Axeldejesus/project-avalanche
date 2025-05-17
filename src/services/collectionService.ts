import { db, auth } from './authenticate';
import { collection, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, limit, startAfter, DocumentSnapshot, setDoc, addDoc } from 'firebase/firestore';

export interface CollectionItem {
  id?: string;
  userId: string;
  gameId: number;
  gameName: string;
  gameCover: string;
  status: string; // "completed", "playing", "toPlay", "abandoned", "wishlist"
  rating?: number; // Optional user rating
  notes?: string; // Optional user notes
  hoursPlayed?: number; // Optional tracking of hours played
  addedAt: string;
  updatedAt: string;
}

// Add a game to the user's collection
export const addToCollection = async (
  collectionData: Omit<CollectionItem, 'id' | 'addedAt' | 'updatedAt'>
): Promise<{ success: boolean; error?: string; collectionId?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const userId = auth.currentUser.uid;
    const now = new Date().toISOString();
    
    // Check if game already exists in collection first
    const existingItem = await getUserGameInCollection(userId, collectionData.gameId);
    
    if (existingItem) {
      // Game exists, update its status instead
      const collectionRef = doc(db!, `collections/${userId}/games`, existingItem.id!);
      
      // Create update object only with defined fields to avoid Firestore errors
      const updateData: any = {
        status: collectionData.status,
        updatedAt: now
      };
      
      // Only include these fields if they are defined
      if (collectionData.notes !== undefined) {
        updateData.notes = collectionData.notes;
      }
      
      if (collectionData.rating !== undefined) {
        updateData.rating = collectionData.rating;
      }
      
      if (collectionData.hoursPlayed !== undefined) {
        updateData.hoursPlayed = collectionData.hoursPlayed;
      }
      
      await updateDoc(collectionRef, updateData);
      
      return { success: true, collectionId: existingItem.id };
    }
    
    // Game doesn't exist, create new entry
    // Use gameId as document ID for easier lookup
    const gameDocId = collectionData.gameId.toString();
    const collectionRef = doc(db!, `collections/${userId}/games`, gameDocId);
    
    // Create a clean object without undefined values
    const newGameData: any = {
      userId,
      gameId: collectionData.gameId,
      gameName: collectionData.gameName,
      gameCover: collectionData.gameCover,
      status: collectionData.status,
      addedAt: now,
      updatedAt: now
    };
    
    // Only add optional fields if they're defined
    if (collectionData.notes !== undefined) {
      newGameData.notes = collectionData.notes;
    }
    
    if (collectionData.rating !== undefined) {
      newGameData.rating = collectionData.rating;
    }
    
    if (collectionData.hoursPlayed !== undefined) {
      newGameData.hoursPlayed = collectionData.hoursPlayed;
    }
    
    await setDoc(collectionRef, newGameData);

    return { success: true, collectionId: gameDocId };
  } catch (error: any) {
    console.error('Error adding to collection:', error);
    return { success: false, error: error.message };
  }
};

// Update a game in the collection
export const updateCollection = async (
  gameId: number,
  data: { status?: string; notes?: string; rating?: number; hoursPlayed?: number }
): Promise<{ success: boolean; error?: string }> => {
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

    await updateDoc(collectionRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating collection:', error);
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
      items.push({
        id: doc.id,
        ...doc.data()
      } as CollectionItem);
    });

    const hasMore = items.length === pageSize;
    return { items, lastDoc: newLastDoc, hasMore };
  } catch (error: any) {
    console.error('Error getting collection:', error);
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

    const gameDocId = gameId.toString();
    const collectionRef = doc(db, `collections/${userId}/games`, gameDocId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      return null;
    }

    return {
      id: collectionDoc.id,
      ...collectionDoc.data()
    } as CollectionItem;
  } catch (error: any) {
    console.error('Error checking game in collection:', error);
    return null;
  }
};

// Get collection statistics for a user (count by status)
export const getUserCollectionStats = async (
  userId: string
): Promise<{ 
  total: number;
  completed: number;
  playing: number;
  toPlay: number;
  abandoned: number;
  wishlist: number; 
  error?: string;
}> => {
  try {
    if (!db) {
      return { 
        total: 0, completed: 0, playing: 0, 
        toPlay: 0, abandoned: 0, wishlist: 0,
        error: 'Database not initialized' 
      };
    }

    const collectionSnapshot = await getDocs(collection(db, `collections/${userId}/games`));
    
    let stats = {
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
    
    return stats;
  } catch (error: any) {
    console.error('Error getting collection stats:', error);
    return { 
      total: 0, completed: 0, playing: 0, 
      toPlay: 0, abandoned: 0, wishlist: 0,
      error: error.message 
    };
  }
};
