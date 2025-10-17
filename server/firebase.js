import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Check if environment variables are loaded
console.log("Environment variables loaded:", {
  projectId: process.env.FIREBASE_PROJECT_ID ? "Defined" : "Undefined",
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? "Defined" : "Undefined",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "Defined" : "Undefined"
});

// Initialize Firebase Admin SDK
let appInstance;
let db;

try {
  // Check if app already initialized to prevent multiple initializations
  if (!admin.apps.length) {
    appInstance = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } else {
    appInstance = admin.app();
  }
  
  db = admin.firestore();
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Function to test Firebase connection
const testConnection = async () => {
  try {
    if (!db) {
      console.error('Firebase Firestore instance is not initialized');
      return false;
    }
    
    // Try to get a collection
    const querySnapshot = await db.collection('utilisateur').limit(1).get();
    return true;
  } catch (error) {
    console.error('Error connecting to Firebase:', error);
    
    // Check for specific permission errors
    if (error.code === 'permission-denied') {
      console.error('\n---- FIREBASE PERMISSION ERROR ----');
      console.error('Your Firebase Admin credentials may be incorrect or missing.');
      console.error('------------------------------------\n');
    }
    
    return false;
  }
};

export { appInstance as app, db, testConnection };
