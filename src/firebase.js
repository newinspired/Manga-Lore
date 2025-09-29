// /src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // <-- ajouté

const firebaseConfig = {
  apiKey: "AIzaSyAmdPp0QGnn2fUAPqrPeNsiuG9_gDWYrOI",
  authDomain: "manga-lore.firebaseapp.com",
  projectId: "manga-lore",
  storageBucket: "manga-lore.firebasestorage.app",
  messagingSenderId: "624614134469",
  appId: "1:624614134469:web:998e06b6b5582b895396ac",
  measurementId: "G-6EYWF4VELN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ⚡ Initialise Firebase Auth
const auth = getAuth(app);

export { app, analytics, auth };
