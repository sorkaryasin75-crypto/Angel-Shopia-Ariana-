// Firebase v10/v11 (Latest Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ১. আপনার Firebase প্রজেক্টের কনফিগারেশন অবজেক্ট
const firebaseConfig = {
  apiKey: "AIzaSyDVhHK08A9XYg-RaWozGSorHv0e2pgDzG4",
  authDomain: "arina-468c4.firebaseapp.com",
  databaseURL: "https://arina-468c4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "arina-468c4",
  storageBucket: "arina-468c4.firebasestorage.app",
  messagingSenderId: "881029049599",
  appId: "1:881029049599:web:a641051e14586202d130ca"
};
// ২. Firebase ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * ৩. Async অ্যাডমিন লগইন হেল্পার ফাংশন
 * এটি Authentication সম্পন্ন করার পর Firestore-এ UID যাচাই করে।
 */
export async function loginAdminAsync(email, password) {
  try {
    // ধাপ ১: ইমেইল ও পাসওয়ার্ড দিয়ে সাইন ইন
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ধাপ ২: Firestore-এর 'admins' কালেকশনে UID ডাটাবেজে আছে কিনা চেক করা
    const adminDocRef = doc(db, "admins", user.uid);
    const adminDocSnap = await getDoc(adminDocRef);

    if (adminDocSnap.exists()) {
      const adminData = adminDocSnap.data();

      // যদি অ্যাকাউন্টের স্ট্যাটাস সক্রিয় থাকে
      if (adminData.isActive !== false) {
        return { success: true, user: user, adminData: adminData };
      } else {
        await signOut(auth);
        throw new Error("আপনার অ্যাডমিন অ্যাকাউন্টটি নিষ্ক্রিয় (Inactive) অবস্থায় রয়েছে।");
      }
    } else {
      // যদি admins কালেকশনে UID না থাকে তবে সাইন আউট করে দেবে
      await signOut(auth);
      throw new Error("Access Denied: Account not listed as an active administrator.");
    }

  } catch (error) {
    console.error("Admin Authentication Error:", error);
    throw error;
  }
}
