import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { config } from './env';

import { config } from './env'; console.log('FIREBASE CONFIG:', config.firebase); // <-- Add this line

// Use the config object for all env variables
const firebaseConfig = config.firebase;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
