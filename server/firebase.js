import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Check if environment variables are loaded
console.log("Environment variables loaded:", {
  apiKey: process.env.FIREBASE_API_KEY ? "Defined" : "Undefined",
  projectId: process.env.FIREBASE_PROJECT_ID ? "Defined" : "Undefined"
});

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.error("Analytics initialization failed:", error.message);
}
const db = getFirestore(app);

// Function to test Firebase connection
const testConnection = async () => {
  try {
    // Try to get a collection (replace 'test' with an actual collection in your database)
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('Successfully connected to Firebase! Found', querySnapshot.size, 'documents');
    return true;
  } catch (error) {
    console.error('Error connecting to Firebase:', error);
    
    // Check for specific permission errors
    if (error.code === 'permission-denied') {
      console.error('\n---- FIREBASE PERMISSION ERROR ----');
      console.error('Your Firebase credentials may be correct but you dont have permission to access this project or collection.');
      console.error('Verify that:');
      console.error('1. Your project ID matches what\'s in your .env file');
      console.error('2. You have Firestore enabled in your Firebase console');
      console.error('3. You have proper security rules configured');
      console.error('4. You\'ve added your IP to any IP allowlist if applicable');
      console.error('------------------------------------\n');
    }
    
    return false;
  }
};

// Comment out or remove this direct function call as we'll call it from server/index.js
/*
testConnection()
  .then(connected => {
    if (connected) {
      console.log('Firebase connection test passed!');
    } else {
      console.log('Firebase connection test failed!');
    }
  });
*/

export { app, analytics, db, testConnection };
