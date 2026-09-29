// Firebase v10+ Web SDK Modular Imports via CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getDatabase, ref, get, set, update, remove, onValue, push, serverTimestamp, query, orderByChild, equalTo 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Global Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDVhHK08A9XYg-RaWozGSorHv0e2pgDzG4",
  authDomain: "arina-468c4.firebaseapp.com",
  databaseURL: "https://arina-468c4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "arina-468c4",
  storageBucket: "arina-468c4.firebasestorage.app",
  messagingSenderId: "881029049599",
  appId: "1:881029049599:web:a641051e14586202d130ca"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { 
  app, db, auth, 
  ref, get, set, update, remove, onValue, push, serverTimestamp, query, orderByChild, equalTo,
  signInWithEmailAndPassword, signOut, onAuthStateChanged 
};
