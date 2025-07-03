import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { config } from './env'; // Only import ONCE

console.log('FIREBASE CONFIG:', config.firebase); // Log it ONCE

const firebaseConfig = config.firebase; // Use it here

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
