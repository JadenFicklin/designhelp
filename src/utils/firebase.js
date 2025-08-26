import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized with config:', {
  apiKey: firebaseConfig.apiKey ? '***' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL ? '***' : 'MISSING'
});

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
console.log('Firebase database initialized');

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Set persistence to LOCAL (persists even after browser restart)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

console.log('Firebase auth initialized');

// Database references
export const itemsRef = (id) => id ? `items/${id}` : 'items';
export const categoriesRef = (id) => id ? `categories/${id}` : 'categories';
export const assetsRef = (id) => id ? `assets/${id}` : 'assets';
export const flashcardsRef = (id) => id ? `flashcards/${id}` : 'flashcards';
