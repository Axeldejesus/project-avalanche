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
  doc, 
  setDoc, 
  getDoc,
  Firestore,
  deleteDoc
} from "firebase/firestore";
import { 
  RegisterInputSchema, 
  LoginInputSchema, 
  UserProfileSchema,
  type UserProfile
} from '../schemas';

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

// Constante pour la durée maximale de session (7 jours en millisecondes)
const MAX_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

// ⚠️ SÉCURITÉ: Validation stricte des entrées utilisateur
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, ''); // Empêcher XSS basique
};

// Enregistrer la date de dernière connexion
export const setLastLoginTimestamp = (): void => {
  if (isClient) {
    localStorage.setItem('lastLoginTimestamp', Date.now().toString());
  }
};

// Rafraîchir le timestamp lors d'actions importantes
export const refreshSessionTimestamp = (): void => {
  if (isClient) {
    setLastLoginTimestamp();
  }
};

// Vérifier si la session a expiré (plus de 7 jours)
export const hasSessionExpired = (): boolean => {
  if (!isClient) return false;
  
  const lastLoginStr = localStorage.getItem('lastLoginTimestamp');
  if (!lastLoginStr) return false;
  
  const lastLogin = parseInt(lastLoginStr, 10);
  const now = Date.now();
  
  return (now - lastLogin) > MAX_SESSION_DURATION;
}

// Service d'inscription - Add Zod validation
export const registerUser = async (email: string, password: string, username: string) => {
  if (!isClient || !auth) {
    console.error('Firebase auth is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    // ⚠️ SÉCURITÉ: Sanitization avant validation
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedUsername = sanitizeInput(username);
    
    // Validate input with Zod
    const validatedInput = RegisterInputSchema.parse({ 
      email: sanitizedEmail, 
      password, 
      username: sanitizedUsername 
    });
    
    // 1. Créer l'utilisateur dans Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, validatedInput.email, validatedInput.password);
    const user = userCredential.user;
    
    // 2. Créer un document utilisateur dans Firestore
    const profileData: Omit<UserProfile, 'updatedAt'> = {
      userId: user.uid,
      username: validatedInput.username,
      email: validatedInput.email,
      createdAt: new Date().toISOString()
    };
    
    await createUserProfile(user.uid, profileData);
    
    // ⚠️ SÉCURITÉ: Enregistrer le timestamp après succès
    setLastLoginTimestamp();
    
    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Données invalides: ' + error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
    return {
      success: false,
      error: error.code || error.message
    };
  }
};

// Service de connexion - Add Zod validation
export const loginUser = async (email: string, password: string) => {
  if (!isClient || !auth) {
    console.error('Firebase auth is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    // ⚠️ SÉCURITÉ: Sanitization avant validation
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate input with Zod
    const validatedInput = LoginInputSchema.parse({ email: sanitizedEmail, password });
    
    const userCredential = await signInWithEmailAndPassword(auth, validatedInput.email, validatedInput.password);
    
    // ⚠️ SÉCURITÉ: Vérifier si la session a expiré
    if (hasSessionExpired()) {
      await signOut(auth);
      return {
        success: false,
        error: 'Session expirée. Veuillez vous reconnecter.'
      };
    }
    
    // Enregistrer la date de connexion
    setLastLoginTimestamp();
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Données invalides: ' + error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
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
    
    // ⚠️ SÉCURITÉ: Nettoyer TOUT le cache lors de la déconnexion
    if (typeof window !== 'undefined') {
      const { CacheManager } = await import('../utils/cacheManager');
      CacheManager.clearAll();
      localStorage.removeItem('lastLoginTimestamp');
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Créer un profil utilisateur dans Firestore - Add Zod validation
export const createUserProfile = async (userId: string, data: Omit<UserProfile, 'updatedAt'>) => {
  if (!isClient || !db) {
    console.error('Firebase db is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    // Create a clean profile object with only the required fields
    const profileData = {
      userId: data.userId || userId,
      username: data.username,
      email: data.email,
      createdAt: data.createdAt,
      ...(data.profilePicture !== undefined && { profilePicture: data.profilePicture }),
      ...(data.profileImageUrl !== undefined && { profileImageUrl: data.profileImageUrl })
    };
    
    // Validate profile data with Zod
    const validatedData = UserProfileSchema.omit({ updatedAt: true }).parse(profileData);
    
    const userRef = doc(db, "utilisateur", userId);
    await setDoc(userRef, validatedData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la création du profil:", error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
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

// Mettre à jour un profil utilisateur dans Firestore - Add Zod validation
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  if (!isClient || !db) {
    console.error('Firebase db is not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    // Validate partial profile data with Zod
    const validatedData = UserProfileSchema.partial().parse(data);
    
    const userRef = doc(db, "utilisateur", userId);
    await setDoc(userRef, { ...validatedData, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.issues.map((issue: any) => issue.message).join(', ')
      };
    }
    
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
