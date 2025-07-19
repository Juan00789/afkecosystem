
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, type Auth, getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { firebaseConfig as importedConfig } from './firebase-config';

const firebaseConfig: FirebaseOptions = importedConfig;

// Provide a clear error if the config is not filled.
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('XXX')) {
    throw new Error("Missing or incomplete Firebase configuration. Please check your src/lib/firebase-config.ts file and paste your project's configuration object.");
}

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// This function can be used to get the auth instance, ensuring it's initialized correctly for the client.
let auth: Auth;
export const getFirebaseAuth = () => {
    if (typeof window === 'undefined') {
        return getAuth(app); 
    }
    
    if (!auth) {
        const { browserLocalPersistence } = require("firebase/auth");
        auth = initializeAuth(app, {
          persistence: browserLocalPersistence,
        });
    }
    return auth;
};

export { db, storage };
