import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  Firestore,
  query,
  where,
  getDocs,
  deleteDoc
} from "firebase/firestore";

// Check if we're running on the client (browser) or server
const isClient = typeof window !== 'undefined';

// Configuration Firebase - Make sure to use NEXT_PUBLIC_ prefix for client-side env vars
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only on the client side
let app;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isClient) {
  // Verify that API key exists before initializing
  if (!firebaseConfig.apiKey) {
    console.error('Firebase API key is missing. Make sure NEXT_PUBLIC_FIREBASE_API_KEY is set in your environment variables.');
  } else {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('Firebase initialized successfully on client side');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
}

// Helper function to safely get Firestore instance
export function ensureFirestore(): Firestore {
  if (!isClient || !db) {
    throw new Error('Firestore is not initialized. This operation can only be performed in a browser environment.');
  }
  return db;
}

// Service d'inscription - Add safety checks
export const registerUser = async (email: string, password: string, username: string) => {
  if (!isClient || !auth) {
    console.error('Firebase auth is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    // 1. Créer l'utilisateur dans Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 2. Créer un document utilisateur dans Firestore
    await createUserProfile(user.uid, {
      username,
      email,
      createdAt: new Date().toISOString()
    });
    
    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error);
    return {
      success: false,
      error: error.code || error.message
    };
  }
};

// Service de connexion - Add safety checks
export const loginUser = async (email: string, password: string) => {
  if (!isClient || !auth) {
    console.error('Firebase auth is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error);
    return {
      success: false,
      error: error.code || error.message
    };
  }
};

// Service de déconnexion - Add safety checks
export const logoutUser = async () => {
  if (!isClient || !auth) {
    console.error('Firebase auth is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Créer un profil utilisateur dans Firestore - Add safety checks
export const createUserProfile = async (userId: string, data: any) => {
  if (!isClient || !db) {
    console.error('Firebase db is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    console.log(`Attempting to create user profile for userId: ${userId}`);
    console.log('With data:', data);
    
    const userRef = doc(db, "utilisateur", userId);
    await setDoc(userRef, data);
    
    console.log(`User profile created successfully for userId: ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la création du profil:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Vérifie si un profil utilisateur existe dans Firestore
export const checkUserProfileExists = async (userId: string) => {
  if (!isClient || !db) {
    console.error('Firebase db is not initialized');
    return { exists: false, error: 'Firebase not initialized' };
  }

  try {
    const userRef = doc(db, "utilisateur", userId);
    const userSnap = await getDoc(userRef);
    
    return { 
      exists: userSnap.exists(),
      data: userSnap.exists() ? userSnap.data() : null
    };
  } catch (error: any) {
    console.error("Erreur lors de la vérification du profil:", error);
    return {
      exists: false,
      error: error.message
    };
  }
};

// Récupère un profil utilisateur dans Firestore
export const getUserProfile = async (userId: string) => {
  if (!isClient || !db) {
    console.error('Firebase db is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const userRef = doc(db, "utilisateur", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { 
        success: false, 
        error: 'User profile not found' 
      };
    }
    
    return {
      success: true,
      data: userSnap.data()
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération du profil:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Mettre à jour un profil utilisateur dans Firestore
export const updateUserProfile = async (userId: string, data: any) => {
  if (!isClient || !db) {
    console.error('Firebase db is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const userRef = doc(db, "utilisateur", userId);
    await setDoc(userRef, data, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service de suppression de compte
export const deleteUserAccount = async (password: string) => {
  if (!isClient || !auth) {
    console.error('Firebase auth is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      return { 
        success: false, 
        error: 'No authenticated user found or email missing' 
      };
    }
    
    // Réauthentifier l'utilisateur avant de supprimer le compte
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    // Supprimer les données utilisateur dans Firestore d'abord
    if (db) {
      const userRef = doc(db, "utilisateur", user.uid);
      await deleteDoc(userRef);
    }
    
    // Supprimer le compte utilisateur dans Firebase Auth
    await deleteUser(user);
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la suppression du compte:", error);
    
    if (error.code === 'auth/wrong-password') {
      return {
        success: false,
        error: 'Mot de passe incorrect'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression du compte'
    };
  }
};

// Observer les changements d'état d'authentification - Add safety checks
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!isClient || !auth) {
    console.error('Firebase auth is not initialized');
    return () => {}; // Return a no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

export { auth, db };
