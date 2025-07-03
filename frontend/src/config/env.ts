// Simple environment configuration that works around TypeScript issues
export const config = {
  apiUrl: (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:8000',
  firebase: {
    apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY || "AIzaSyBfPjAU2usnP6ofheyfGgZ6-NK2VuHAEAc",
    authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN || "ordix-65b91.firebaseapp.com",
    projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID || "ordix-65b91",
    storageBucket: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET || "ordix-65b91.firebasestorage.app",
    messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "480905571530",
    appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID || "1:480905571530:web:df9cda514086474d815833",
    measurementId: (import.meta as any)?.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-HJ70T8VWJL"
  }
}; 
