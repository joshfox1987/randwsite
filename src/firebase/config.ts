// src/firebase/firestore/config.ts

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';

/**
 * Firebase project configuration.
 * Exported so it can be used by initializeFirebase in src/firebase/init.ts.
 */
export const firebaseConfig = {
  "projectId": "studio-3066782500-b50dd",
  "appId": "1:642303940569:web:f107ba74578549d7fb2bc8",
  "apiKey": "AIzaSyAiBRa5IvitB3QGNJDZw5vzsPphPN5L0tQ",
  "authDomain": "studio-3066782500-b50dd.firebaseapp.com",
  "storageBucket": "studio-3066782500-b50dd.appspot.com",
  "measurementId": "G-9V6L6XG6Y7",
  "messagingSenderId": "642303940569"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const storage = getStorage(app);
