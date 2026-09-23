/**
 * Firebase project configuration.
 * Explicitly exported for use in the app and server actions.
 */
export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-3066782500-b50dd',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:3066782500:web:0000000000',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForPrerenderingBuild00000',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'studio-3066782500-b50dd.firebaseapp.com',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-3066782500-b50dd.firebasestorage.app',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '3066782500',
} as const;
