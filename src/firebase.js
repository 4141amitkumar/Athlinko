// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Import Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAS5Xbi4XbDWy-YsvKxwgUwgDtq9IgVWjQ",
  authDomain: "athlinko-33994.firebaseapp.com",
  // This is the crucial addition
  databaseURL: "https://athlinko-33994-default-rtdb.firebaseio.com",
  projectId: "athlinko-33994",
  storageBucket: "athlinko-33994.firebasestorage.app",
  messagingSenderId: "614648250953",
  appId: "1:614648250953:web:3c39127fdaa47300e93598",
  measurementId: "G-QDFHV5BVTC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it for use in other components
export const db = getFirestore(app);
export const storage = getStorage(app);
// Initialize and export Realtime Database
export const rtdb = getDatabase(app);

