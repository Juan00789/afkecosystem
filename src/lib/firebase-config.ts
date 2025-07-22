// src/lib/firebase-config.ts

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7gkBqO4LfBCiKLD3kXQ29J4JUJg9vuas",
  authDomain: "afkecosystem.firebaseapp.com",
  projectId: "afkecosystem",
  storageBucket: "afkecosystem.appspot.com",
  messagingSenderId: "943759593",
  appId: "1:943759593:web:3933b7a70c9ac91c285078"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
