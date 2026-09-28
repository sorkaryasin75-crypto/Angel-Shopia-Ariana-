import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  push, 
  onValue, 
  onChildAdded, 
  onDisconnect, 
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your Firebase Web Project Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVhHK08A9XYg-RaWozGSorHv0e2pgDzG4",
  authDomain: "arina-468c4.firebaseapp.com",
  databaseURL: "https://arina-468c4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "arina-468c4",
  storageBucket: "arina-468c4.firebasestorage.app",
  messagingSenderId: "881029049599",
  appId: "1:881029049599:web:a641051e14586202d130ca"
};
---

### `firebase-config.js`

```javascript
import { initializeApp } from "[https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js](https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js)";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "[https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js](https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js)";
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  push, 
  remove,
  onValue, 
  onChildAdded, 
  onDisconnect, 
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  startAt,
  endAt
} from "[https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js](https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js)";

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
const auth = getAuth(app);
const db = getDatabase(app);

// Configure local session persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Auth persistence error:", error);
});

export { 
  app, 
  auth, 
  db,
  ref, 
  get, 
  set, 
  update, 
  push, 
  remove,
  onValue, 
  onChildAdded, 
  onDisconnect, 
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  startAt,
  endAt,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
