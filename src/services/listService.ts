import { db, auth } from './authenticate';
import { collection, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, limit, startAfter, DocumentSnapshot, setDoc, addDoc } from 'firebase/firestore';
import { 
  ListSchema, 
  ListGameSchema, 
  CreateListInputSchema, 
  UpdateListInputSchema,
  type List,
  type ListGame,
  type CreateListInput,
  type UpdateListInput
} from '../schemas';

// Create a new custom list
export const createList = async (
  listData: CreateListInput
): Promise<{ success: boolean; error?: string; listId?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate input with Zod
    const validatedData = CreateListInputSchema.parse(listData);

    const userId = auth.currentUser.uid;
    const now = new Date().toISOString();
    
    // Create a clean object
    const newList: Omit<List, 'id'> = {
      userId,
      name: validatedData.name,
      description: validatedData.description || '',
      icon: validatedData.icon || 'list',
      color: validatedData.color || '#7c3aed',
      createdAt: now,
      updatedAt: now
    };
    
    // Add to the custom lists collection
    const listsRef = collection(db!, `gameList/${userId}/lists`);
    const docRef = await addDoc(listsRef, newList);

    return { success: true, listId: docRef.id };
  } catch (error: any) {
    console.error('Error creating list:', error);
    
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

// Update an existing list metadata
export const updateList = async (
  listId: string,
  data: UpdateListInput
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate input with Zod
    const validatedData = UpdateListInputSchema.parse(data);

    const userId = auth.currentUser.uid;
    const listRef = doc(db!, `gameList/${userId}/lists`, listId);
    const listDoc = await getDoc(listRef);
    
    if (!listDoc.exists()) {
      return { success: false, error: 'List not found' };
    }

    // Update only the provided fields
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(listRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating list:', error);
    
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

// Delete an existing list and all its games
export const deleteList = async (
  listId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const userId = auth.currentUser.uid;
    const listRef = doc(db!, `gameList/${userId}/lists`, listId);
    
    // Check if list exists
    const listDoc = await getDoc(listRef);
    if (!listDoc.exists()) {
      return { success: false, error: 'List not found' };
    }
    
    // Delete the list
    await deleteDoc(listRef);
    
    // Delete all games in the list
    const gamesRef = collection(db!, `gameList/${userId}/lists/${listId}/games`);
    const gamesSnapshot = await getDocs(gamesRef);
    
    // Delete each game document in the subcollection
    const deletePromises = gamesSnapshot.docs.map(gameDoc => 
      deleteDoc(doc(db!, `gameList/${userId}/lists/${listId}/games`, gameDoc.id))
    );
    
    await Promise.all(deletePromises);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting list:', error);
    return { success: false, error: error.message };
  }
};

// Get all lists for a user
export const getUserLists = async (
  userId: string
): Promise<{ lists: List[]; error?: string }> => {
  try {
    if (!db) {
      return { lists: [], error: 'Database not initialized' };
    }

    // Validate userId
    const validatedUserId = ListSchema.shape.userId.parse(userId);

    const listsQuery = query(
      collection(db, `gameList/${validatedUserId}/lists`),
      orderBy('updatedAt', 'desc')
    );
    
    const listsSnapshot = await getDocs(listsQuery);
    const lists: List[] = [];
    
    listsSnapshot.forEach((doc) => {
      try {
        // Validate list data from Firestore
        const listData = ListSchema.parse({
          id: doc.id,
          ...doc.data()
        });
        lists.push(listData);
      } catch (validationError) {
        console.error('Invalid list data in Firestore:', validationError);
        // Skip invalid lists rather than failing the entire request
      }
    });

    return { lists };
  } catch (error: any) {
    console.error('Error getting user lists:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        lists: [], 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { lists: [], error: error.message };
  }
};

// Add a game to a list
export const addGameToList = async (
  listId: string,
  gameData: Omit<ListGame, 'addedAt'>
): Promise<{ success: boolean; error?: string; gameId?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate input with Zod
    const validatedData = ListGameSchema.omit({ addedAt: true }).parse(gameData);

    const userId = auth.currentUser.uid;
    const now = new Date().toISOString();
    
    // Check if list exists
    const listRef = doc(db!, `gameList/${userId}/lists`, listId);
    const listDoc = await getDoc(listRef);
    
    if (!listDoc.exists()) {
      return { success: false, error: 'List not found' };
    }
    
    // Use gameId as document ID for easier lookup
    const gameDocId = gameData.gameId.toString();
    const gameRef = doc(db!, `gameList/${userId}/lists/${listId}/games`, gameDocId);
    
    // Check if game already exists in this list
    const gameDoc = await getDoc(gameRef);
    
    // Create a clean object
    const gameObject: ListGame = {
      gameId: validatedData.gameId,
      gameName: validatedData.gameName,
      gameCover: validatedData.gameCover,
      addedAt: now,
      notes: validatedData.notes || ''
    };
    
    await setDoc(gameRef, gameObject);
    
    // Update the list's updatedAt timestamp
    await updateDoc(listRef, {
      updatedAt: now
    });

    return { success: true, gameId: gameDocId };
  } catch (error: any) {
    console.error('Error adding game to list:', error);
    
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

// Remove a game from a list
export const removeGameFromList = async (
  listId: string,
  gameId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const userId = auth.currentUser.uid;
    const gameDocId = gameId.toString();
    const gameRef = doc(db!, `gameList/${userId}/lists/${listId}/games`, gameDocId);
    
    // Check if game exists in this list
    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) {
      return { success: false, error: 'Game not found in list' };
    }
    
    // Delete the game from the list
    await deleteDoc(gameRef);
    
    // Update the list's updatedAt timestamp
    const listRef = doc(db!, `gameList/${userId}/lists`, listId);
    await updateDoc(listRef, {
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error removing game from list:', error);
    return { success: false, error: error.message };
  }
};

// Get all games in a list
export const getGamesInList = async (
  userId: string,
  listId: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{
  games: ListGame[];
  lastDoc?: DocumentSnapshot;
  hasMore: boolean;
  error?: string;
}> => {
  try {
    if (!db) {
      return { games: [], hasMore: false, error: 'Database not initialized' };
    }

    // Validate inputs
    const validatedUserId = ListSchema.shape.userId.parse(userId);

    // Check if list exists
    const listRef = doc(db, `gameList/${validatedUserId}/lists`, listId);
    const listDoc = await getDoc(listRef);
    
    if (!listDoc.exists()) {
      return { games: [], hasMore: false, error: 'List not found' };
    }
    
    // Build the query
    let gamesQuery = query(
      collection(db, `gameList/${validatedUserId}/lists/${listId}/games`),
      orderBy('addedAt', 'desc')
    );
    
    // Apply pagination
    if (lastDoc) {
      gamesQuery = query(gamesQuery, startAfter(lastDoc), limit(pageSize));
    } else {
      gamesQuery = query(gamesQuery, limit(pageSize));
    }
    
    const gamesSnapshot = await getDocs(gamesQuery);
    const games: ListGame[] = [];
    let newLastDoc: DocumentSnapshot | undefined;
    
    gamesSnapshot.forEach((doc) => {
      newLastDoc = doc;
      try {
        // Validate game data from Firestore
        const gameData = ListGameSchema.parse(doc.data());
        games.push(gameData);
      } catch (validationError) {
        console.error('Invalid game data in Firestore:', validationError);
        // Skip invalid games rather than failing the entire request
      }
    });
    
    const hasMore = games.length === pageSize;
    
    return { games, lastDoc: newLastDoc, hasMore };
  } catch (error: any) {
    console.error('Error getting games in list:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return { 
        games: [], 
        hasMore: false, 
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return { games: [], hasMore: false, error: error.message };
  }
};

// Check if a game is in a specific list
export const isGameInList = async (
  userId: string,
  listId: string,
  gameId: number
): Promise<{ inList: boolean; error?: string }> => {
  try {
    if (!db) {
      return { inList: false, error: 'Database not initialized' };
    }

    const gameDocId = gameId.toString();
    const gameRef = doc(db, `gameList/${userId}/lists/${listId}/games`, gameDocId);
    
    const gameDoc = await getDoc(gameRef);
    return { inList: gameDoc.exists() };
  } catch (error: any) {
    console.error('Error checking if game is in list:', error);
    return { inList: false, error: error.message };
  }
};

// Get all lists that contain a specific game
export const getListsContainingGame = async (
  userId: string,
  gameId: number
): Promise<{ lists: List[]; error?: string }> => {
  try {
    if (!db) {
      return { lists: [], error: 'Database not initialized' };
    }

    // Get all user lists
    const { lists: allLists, error } = await getUserLists(userId);
    
    if (error) {
      return { lists: [], error };
    }
    
    // For each list, check if it contains the game
    const gameDocId = gameId.toString();
    const listsWithGame: List[] = [];
    
    const checkPromises = allLists.map(async (list) => {
      if (!list.id) return;
      
      const gameRef = doc(db!, `gameList/${userId}/lists/${list.id}/games`, gameDocId);
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        listsWithGame.push(list);
      }
    });
    
    await Promise.all(checkPromises);
    
    return { lists: listsWithGame };
  } catch (error: any) {
    console.error('Error getting lists containing game:', error);
    return { lists: [], error: error.message };
  }
};

// Get the count of games in each list
export const getListsWithCounts = async (
  userId: string
): Promise<{ lists: Array<List & { gameCount: number }>; error?: string }> => {
  try {
    if (!db) {
      return { lists: [], error: 'Database not initialized' };
    }

    // Get all user lists
    const { lists, error } = await getUserLists(userId);
    
    if (error) {
      return { lists: [], error };
    }
    
    // For each list, count the games
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        if (!list.id) return { ...list, gameCount: 0 };
        
        const gamesRef = collection(db!, `gameList/${userId}/lists/${list.id}/games`);
        const gamesSnapshot = await getDocs(gamesRef);
        
        return {
          ...list,
          gameCount: gamesSnapshot.size
        };
      })
    );
    
    return { lists: listsWithCounts };
  } catch (error: any) {
    console.error('Error getting lists with counts:', error);
    return { lists: [], error: error.message };
  }
};
