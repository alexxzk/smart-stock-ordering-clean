import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { config } from './env';

// Use the config object for all env variables
const firebaseConfig = config.firebase;

// Debug logging to check if Firebase config is loaded correctly
console.log('🔥 FIREBASE CONFIG:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  authDomain: firebaseConfig.authDomain || 'MISSING',
  projectId: firebaseConfig.projectId || 'MISSING',
  storageBucket: firebaseConfig.storageBucket || 'MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 10)}...` : 'MISSING',
  measurementId: firebaseConfig.measurementId || 'MISSING'
});

// Log environment variables to check if they're being loaded
console.log('🌍 ENVIRONMENT VARIABLES CHECK:', {
  VITE_FIREBASE_API_KEY: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
  VITE_FIREBASE_AUTH_DOMAIN: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET',
  VITE_FIREBASE_PROJECT_ID: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
  VITE_FIREBASE_STORAGE_BUCKET: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET',
  VITE_FIREBASE_MESSAGING_SENDER_ID: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET',
  VITE_FIREBASE_APP_ID: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID ? 'SET' : 'NOT SET',
  VITE_FIREBASE_MEASUREMENT_ID: (import.meta as any)?.env?.VITE_FIREBASE_MEASUREMENT_ID ? 'SET' : 'NOT SET'
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
