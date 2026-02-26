// src/firebase/firestore/config.ts

// 1. Import the necessary functions from the Firebase SDK.
//    initializeApp is for the core Firebase app.
//    getStorage is specifically for the Cloud Storage service.
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// 2. Define your Firebase project's configuration.
//    You can find these values in your Firebase project settings in the console.
//    Go to Project settings (the gear icon next to "Project overview") -> "Your apps" section.
//    If you already have a web app added, click its config button.
//    If not, add a new web app to get this configuration.
export const firebaseConfig = {
  "projectId": "studio-3066782500-b50dd",
  "appId": "1:642303940569:web:f107ba74578549d7fb2bc8",
  "apiKey": "AIzaSyAiBRa5IvitB3QGNJDZw5vzsPphPN5L0tQ",
  "authDomain": "studio-3066782500-b50dd.firebaseapp.com",
  "storageBucket": "studio-3066782500-b50dd.appspot.com",
  "measurementId": "",
  "messagingSenderId": "642303940569"
};

// 3. Initialize Firebase.
//    This creates a Firebase app instance, connecting your web app to your Firebase project.
const app = initializeApp(firebaseConfig);

// 4. Get a reference to the Storage service.
//    This allows you to interact with Firebase Cloud Storage.
export const storage = getStorage(app);

// You can also export the app instance itself if you need it for other services later:
// export const firebaseApp = app;

// You might also initialize other Firebase services here, for example:
// import { getFirestore } from 'firebase/firestore';
// export const db = getFirestore(app);

// import { getAuth } from 'firebase/auth';
// export const auth = getAuth(app);
