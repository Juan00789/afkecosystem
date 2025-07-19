// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, browserLocalPersistence, type Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { firebaseConfig as importedConfig } from './firebase-config';

const firebaseConfig: FirebaseOptions = importedConfig;

// Provide a clear error if the config is not filled.
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('XXX')) {
    throw new Error("Missing or incomplete Firebase configuration. Please check your src/lib/firebase-config.ts file and paste your project's configuration object.");
}

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth and export it for use in other parts of the app
// This singleton instance will be used across the app
const auth = getAuth(app);

// This function can be used to get the auth instance, ensuring it's initialized.
export const getFirebaseAuth = () => {
    return auth;
};


export const db = getFirestore(app);
export const storage = getStorage(app);
