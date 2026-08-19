import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const defaultDatabaseURL = "https://smart-irrigation-system-7c16b-default-rtdb.asia-southeast1.firebasedatabase.app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || defaultDatabaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-irrigation-system-7c16b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(firebaseConfig.databaseURL);
export const firebaseApp = firebaseEnabled
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
export const database = firebaseApp ? getDatabase(firebaseApp) : null;
