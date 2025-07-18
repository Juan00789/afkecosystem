// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { firebaseConfig as importedConfig } from './firebase-config';

const firebaseConfig: FirebaseOptions = importedConfig;

// Provide a clear error if the config is not filled.
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('XXX')) {
    throw new Error("Missing or incomplete Firebase configuration. Please check your src/lib/firebase-config.ts file and paste your project's configuration object.");
}

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);