// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Import Realtime Database
import { getAuth } from "firebase/auth"; // Import Firebase Auth

// Your web app's Firebase configuration - KEEP AS IS
// Make sure these keys are correct for your Firebase project 'athlinko-new'
const firebaseConfig = {
  apiKey: "AIzaSyAS5Xbi4XbDWy-YsvKxwgUwgDtq9IgVWjQ", // Keep this
  authDomain: "athlinko-33994.firebaseapp.com",
  databaseURL: "https://athlinko-33994-default-rtdb.firebaseio.com",
  projectId: "athlinko-33994",
  storageBucket: "athlinko-33994.firebasestorage.app",
  messagingSenderId: "614648250953",
  appId: "1:614648250953:web:3c39127fdaa47300e93598",
  measurementId: "G-QDFHV5BVTC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore, Storage, RTDB, and Auth
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app); // Initialize and export auth

// Note: We don't need to explicitly export GoogleAuthProvider from here,
// as components like Login.js and Register.js will import it directly from 'firebase/auth'
