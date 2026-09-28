/**
 * Firebase Production Central Configuration & Helper Module
 * Uses Firebase Web Modular SDK v10 via CDN (GitHub Pages Compatible)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  push, 
  remove, 
  onValue, 
  onDisconnect, 
  serverTimestamp, 
  query, 
  orderByChild, 
  limitToLast 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// REPLACE THESE VALUES WITH YOUR FIREBASE CONSOLE PROJECT KEYS
const firebaseConfig = {
  apiKey: "AIzaSyDVhHK08A9XYg-RaWozGSorHv0e2pgDzG4",
  authDomain: "arina-468c4.firebaseapp.com",
  databaseURL: "https://arina-468c4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "arina-468c4",
  storageBucket: "arina-468c4.firebasestorage.app",
  messagingSenderId: "881029049599",
  appId: "1:881029049599:web:a641051e14586202d130ca"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Export Helpers
export {
  app,
  auth,
  db,
  // Auth Functions
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  // Database Functions
  ref,
  get,
  set,
  update,
  push,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast
};
