import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ⚠️ SÉCURITÉ: Validation des variables d'environnement
function validateEnvironment() {
  const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Initialiser Firebase Admin une seule fois
function initFirebaseAdmin() {
  // ⚠️ SÉCURITÉ: Vérifier l'environnement
  validateEnvironment();
  
  const apps = getApps();
  
  if (!apps.length) {
    // Récupérer les identifiants de l'environnement
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    try {
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }

  return getFirestore();
}

// Exporter la fonction d'initialisation
export const getAdminFirestore = () => {
  return initFirebaseAdmin();
};
